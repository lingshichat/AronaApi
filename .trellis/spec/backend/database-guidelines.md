# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

The backend uses GORM v2 and must support SQLite, MySQL, and PostgreSQL at the
same time. SQLite is the default when `SQL_DSN` is empty or local. MySQL and
PostgreSQL are selected from the DSN in `model/main.go`.

Database code should prefer GORM methods. Raw SQL is allowed only when GORM does
not cover the behavior or when a database-specific migration requires it. Any raw
SQL must account for SQLite/MySQL/PostgreSQL differences.

---

## Connection and Migration Flow

`model/main.go` owns database startup:

```go
db, err := chooseDB("SQL_DSN", false)
DB = db
err = migrateDB()
```

`chooseDB` sets dialect flags:

- `common.UsingSQLite`
- `common.UsingMySQL`
- `common.UsingPostgreSQL`
- `common.LogSqlType`

`migrateDB` runs `DB.AutoMigrate` for most models:

```go
err := DB.AutoMigrate(
    &Channel{},
    &Token{},
    &User{},
    &PasskeyCredential{},
    &Option{},
    &Redemption{},
    &Ability{},
    &Log{},
    &Midjourney{},
    &TopUp{},
    &QuotaData{},
    &Task{},
    &Model{},
    &Vendor{},
    &PrefillGroup{},
    &Setup{},
    &TwoFA{},
    &TwoFABackupCode{},
    &Checkin{},
    &SubscriptionOrder{},
    &UserSubscription{},
    &SubscriptionPreConsumeRecord{},
    &CustomOAuthProvider{},
    &UserOAuthBinding{},
)
```

SQLite-specific schema handling is separated when needed:

```go
if common.UsingSQLite {
    if err := ensureSubscriptionPlanTableSQLite(); err != nil {
        return err
    }
} else {
    if err := DB.AutoMigrate(&SubscriptionPlan{}); err != nil {
        return err
    }
}
```

---

## Query Patterns

### Use GORM for normal reads and writes

Examples:

`model/prefill_group.go`

```go
query := DB.Model(&PrefillGroup{})
if groupType != "" {
    query = query.Where("type = ?", groupType)
}
err := query.Order("updated_time DESC").Find(&groups).Error
```

`model/token.go`

```go
err = DB.Where(commonKeyCol+" = ?", key).First(&token).Error
```

`model/channel.go`

```go
err := DB.Model(&Channel{}).
    Where("id = ?", id).
    Update("used_quota", gorm.Expr("used_quota + ?", quota)).
    Error
```

### Count and page in the model layer

Controllers should not assemble pagination SQL. Existing model functions accept
`common.PageInfo`, `startIdx`, and `num`.

Examples:

- `model.GetAllUsers(pageInfo)` counts then fetches users.
- `model.SearchUserTokens(userId, keyword, token, offset, limit)` validates
  search patterns, caps limits, counts, then fetches rows.

### Use transactions for multi-step state changes

Use `DB.Transaction` for simple closure-style transactions, or `DB.Begin` when
the existing code needs manual rollback/commit.

Examples:

`model/checkin.go`

```go
err := DB.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(checkin).Error; err != nil {
        return err
    }
    return tx.Model(&User{}).Where("id = ?", userId).
        Update("quota", gorm.Expr("quota + ?", quotaAwarded)).Error
})
```

`model/token.go`

```go
tx := DB.Begin()
if err := tx.Where("user_id = ? AND id IN (?)", userId, ids).Find(&tokens).Error; err != nil {
    tx.Rollback()
    return 0, err
}
```

### Use atomic SQL expressions for counters and quota

Quota and counters should use `gorm.Expr`, not read-modify-write in Go.

Examples:

- `model/token.go`: `remain_quota + ?`, `used_quota - ?`
- `model/user.go`: `used_quota + ?`, `request_count + ?`
- `model/usedata.go`: `count + ?`, `quota + ?`, `token_used + ?`

### Use `Select` when zero values must be updated

GORM `Updates(struct)` skips zero values unless fields are selected.

Examples:

`model/token.go`

```go
return DB.Model(token).
    Select("accessed_time", "status").
    Updates(token).Error
```

`model/token.go`

```go
err = DB.Model(token).Select(
    "name", "status", "expired_time", "remain_quota", "unlimited_quota",
    "model_limits_enabled", "model_limits", "allow_ips", "group", "cross_group_retry",
).Updates(token).Error
```

---

## Cross-Database Compatibility Rules

### Reserved column names

The project has reserved-word columns like `group` and `key`. Use the common
quoted column variables from `model/main.go`:

```go
var commonGroupCol string
var commonKeyCol string
var commonTrueVal string
var commonFalseVal string
```

PostgreSQL uses double quotes. MySQL and SQLite use backticks.

Example:

```go
query = query.Where("("+likeCondition+") AND "+commonGroupCol+" = ?", ..., group)
```

### Boolean SQL values

Raw SQL that needs boolean literals must use:

- `commonTrueVal`
- `commonFalseVal`

Do not hard-code `true`, `false`, `1`, or `0` in raw SQL shared by all dialects.

### Database-specific string functions

Branch when SQL differs by dialect.

Example from `model/channel.go`:

```go
if common.UsingMySQL {
    groupCondition = `CONCAT(',', ` + commonGroupCol + `, ',') LIKE ?`
} else {
    groupCondition = `(',' || ` + commonGroupCol + ` || ',') LIKE ?`
}
```

### SQLite ALTER limitations

SQLite does not support many `ALTER COLUMN` operations. Use add-column workarounds
or skip type-affinity changes.

Examples:

- `ensureSubscriptionPlanTableSQLite()` creates or adds columns manually.
- `migrateTokenModelLimitsToText()` returns early for SQLite.
- `migrateSubscriptionPlanPriceAmount()` returns early for SQLite.

---

## Model Struct Conventions

Use exported struct fields with JSON and GORM tags.

Examples:

`model/token.go`

```go
type Token struct {
    Id             int            `json:"id"`
    UserId         int            `json:"user_id" gorm:"index"`
    Key            string         `json:"key" gorm:"type:varchar(128);uniqueIndex"`
    DeletedAt      gorm.DeletedAt `gorm:"index"`
}
```

`model/channel.go`

```go
type Channel struct {
    Id           int     `json:"id"`
    Key          string  `json:"key" gorm:"not null"`
    Weight       *uint   `json:"weight" gorm:"default:0"`
    ModelMapping *string `json:"model_mapping" gorm:"type:text"`
}
```

`model/prefill_group.go`

```go
type PrefillGroup struct {
    Id          int            `json:"id"`
    Name        string         `json:"name" gorm:"size:64;not null;uniqueIndex:uk_prefill_name,where:deleted_at IS NULL"`
    Type        string         `json:"type" gorm:"size:32;index;not null"`
    Items       JSONValue      `json:"items" gorm:"type:json"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}
```

Pointers are used for nullable values and for fields where explicit zero must be
preserved. Text/JSON payloads should usually be stored as `TEXT` or compatible
custom scanner/valuer types, not PostgreSQL-only `JSONB`.

---

## JSON Columns and Scanner/Valuer Types

For DB-backed JSON fields, prefer types that implement `driver.Valuer` and
`sql.Scanner`.

Examples:

`model/channel.go`

```go
func (c ChannelInfo) Value() (driver.Value, error) {
    return common.Marshal(&c)
}

func (c *ChannelInfo) Scan(value interface{}) error {
    bytesValue, _ := value.([]byte)
    return common.Unmarshal(bytesValue, c)
}
```

`model/prefill_group.go`

```go
type JSONValue json.RawMessage

func (j JSONValue) Value() (driver.Value, error) {
    if j == nil {
        return nil, nil
    }
    return []byte(j), nil
}
```

New marshal/unmarshal logic should use `common.Marshal` and `common.Unmarshal`.
Some legacy model code still calls `encoding/json`; do not copy that pattern into
new business code.

---

## Redis and Cache Side Effects

When a model write affects cached data, update or delete cache in the same model
method. Existing code often schedules cache work through `gopool.Go`.

Examples:

`model/token.go`

```go
defer func() {
    if shouldUpdateRedis(true, err) {
        gopool.Go(func() {
            err := cacheSetToken(*token)
            if err != nil {
                common.SysLog("failed to update token cache: " + err.Error())
            }
        })
    }
}()
```

`model/token.go`

```go
if common.RedisEnabled {
    gopool.Go(func() {
        err := cacheDecrTokenQuota(key, int64(quota))
        if err != nil {
            common.SysLog("failed to decrease token quota: " + err.Error())
        }
    })
}
```

Document whether the DB write or cache write is authoritative. In this project,
DB state remains authoritative.

---

## Migrations

Migration code must be idempotent. Check table/column existence and current type
before changing schema.

Examples:

- `migrateTokenModelLimitsToText()` checks table, column, dialect, and current
  type before running `ALTER`.
- `migrateSubscriptionPlanPriceAmount()` checks the current data type and logs
  warnings instead of crashing on non-critical conversion failures.
- `ensureSubscriptionPlanTableSQLite()` creates the SQLite table manually and
  adds missing columns one by one.

Rules:

- Add new model structs to `migrateDB()` or the right migration function.
- Add log DB models to `migrateLOGDB()` only when they belong to the log database.
- Do not use `AUTO_INCREMENT`, `SERIAL`, or dialect-only column types directly.
- Avoid destructive migrations. Prefer additive changes.
- Keep migration functions safe to run more than once.

---

## Tests

DB tests usually use in-memory SQLite:

`model/task_cas_test.go`

```go
db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
DB = db
LOG_DB = db
common.UsingSQLite = true
common.RedisEnabled = false
```

Use `AutoMigrate` in test setup for the models under test. Clean tables with
helpers and `t.Cleanup`.

When logic branches by dialect, add tests that set the dialect flags and assert
generated behavior when full database integration is not practical.

---

## Common Mistakes

- Using raw SQL without branching for PostgreSQL quoting or SQLite limitations.
- Forgetting `commonGroupCol` / `commonKeyCol` for reserved columns.
- Using `Updates(struct)` and expecting zero values to persist.
- Adding JSON marshal/unmarshal with `encoding/json` in new business code.
- Changing quota counters with read-modify-write instead of `gorm.Expr`.
- Updating DB rows but forgetting Redis cache invalidation or refresh.
- Adding migrations that pass on MySQL but fail on SQLite.
