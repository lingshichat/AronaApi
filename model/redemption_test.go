package model

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupRedemptionTestDB(t *testing.T) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	oldDB := DB
	oldLogDB := LOG_DB
	oldMainDatabaseType := common.MainDatabaseType()
	oldLogDatabaseType := common.LogDatabaseType()
	oldRedisEnabled := common.RedisEnabled
	oldGroupCol := commonGroupCol
	oldKeyCol := commonKeyCol
	oldSubscriptionPlanCacheOnce := subscriptionPlanCacheOnce
	oldSubscriptionPlanInfoCacheOnce := subscriptionPlanInfoCacheOnce
	oldSubscriptionPlanCache := subscriptionPlanCache
	oldSubscriptionPlanInfoCache := subscriptionPlanInfoCache

	DB = db
	LOG_DB = db
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	common.RedisEnabled = false
	commonGroupCol = "`group`"
	commonKeyCol = "`key`"
	subscriptionPlanCacheOnce = sync.Once{}
	subscriptionPlanInfoCacheOnce = sync.Once{}
	subscriptionPlanCache = nil
	subscriptionPlanInfoCache = nil

	require.NoError(t, DB.AutoMigrate(&User{}, &Redemption{}, &SubscriptionPlan{}, &UserSubscription{}, &Log{}))

	t.Cleanup(func() {
		DB = oldDB
		LOG_DB = oldLogDB
		common.SetDatabaseTypes(oldMainDatabaseType, oldLogDatabaseType)
		common.RedisEnabled = oldRedisEnabled
		commonGroupCol = oldGroupCol
		commonKeyCol = oldKeyCol
		subscriptionPlanCacheOnce = oldSubscriptionPlanCacheOnce
		subscriptionPlanInfoCacheOnce = oldSubscriptionPlanInfoCacheOnce
		subscriptionPlanCache = oldSubscriptionPlanCache
		subscriptionPlanInfoCache = oldSubscriptionPlanInfoCache
	})
}

func createRedemptionTestUser(t *testing.T, username string) *User {
	t.Helper()
	user := &User{
		Username: username,
		Password: "password",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
		AffCode:  username + "-aff",
	}
	require.NoError(t, DB.Create(user).Error)
	return user
}

func createRedemptionTestPlan(t *testing.T, enabled bool) *SubscriptionPlan {
	t.Helper()
	plan := &SubscriptionPlan{
		Title:            "Pro",
		PriceAmount:      10,
		Currency:         "USD",
		DurationUnit:     SubscriptionDurationDay,
		DurationValue:    30,
		QuotaResetPeriod: SubscriptionResetNever,
		Enabled:          enabled,
		TotalAmount:      12345,
	}
	require.NoError(t, DB.Create(plan).Error)
	if !enabled {
		require.NoError(t, DB.Model(&SubscriptionPlan{}).Where("id = ?", plan.Id).Update("enabled", false).Error)
		plan.Enabled = false
	}
	return plan
}

func TestRedeemQuotaCodeKeepsBackwardCompatibility(t *testing.T) {
	setupRedemptionTestDB(t)
	user := createRedemptionTestUser(t, "quota-user")
	code := &Redemption{
		Name:        "legacy",
		Key:         "quota-code",
		Status:      common.RedemptionCodeStatusEnabled,
		Quota:       500,
		CreatedTime: common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("quota-code", user.Id)
	require.NoError(t, err)
	require.Equal(t, common.RedemptionTypeQuota, result.Type)
	require.Equal(t, 500, result.Quota)

	var refreshed User
	require.NoError(t, DB.First(&refreshed, user.Id).Error)
	require.Equal(t, 500, refreshed.Quota)

	var redeemed Redemption
	require.NoError(t, DB.First(&redeemed, code.Id).Error)
	require.Equal(t, common.RedemptionCodeStatusUsed, redeemed.Status)
	require.Equal(t, user.Id, redeemed.UsedUserId)
}

func TestRedeemQuotaCodeIsSingleUse(t *testing.T) {
	setupRedemptionTestDB(t)
	firstUser := createRedemptionTestUser(t, "single-use-first")
	secondUser := createRedemptionTestUser(t, "single-use-second")
	code := &Redemption{
		Name:        "single",
		Key:         "single-use-code",
		Status:      common.RedemptionCodeStatusEnabled,
		Quota:       500,
		CreatedTime: common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("single-use-code", firstUser.Id)
	require.NoError(t, err)
	require.Equal(t, common.RedemptionTypeQuota, result.Type)

	result, err = Redeem("single-use-code", secondUser.Id)
	require.Nil(t, result)
	require.True(t, errors.Is(err, ErrRedeemFailed))

	var users []User
	require.NoError(t, DB.Where("id IN ?", []int{firstUser.Id, secondUser.Id}).Order("id").Find(&users).Error)
	require.Len(t, users, 2)
	require.Equal(t, 500, users[0].Quota)
	require.Equal(t, 0, users[1].Quota)
}

func TestRedeemSubscriptionCodeCreatesSubscription(t *testing.T) {
	setupRedemptionTestDB(t)
	user := createRedemptionTestUser(t, "sub-user")
	plan := createRedemptionTestPlan(t, true)
	code := &Redemption{
		Name:        "sub",
		Key:         "sub-code",
		Status:      common.RedemptionCodeStatusEnabled,
		Type:        common.RedemptionTypeSubscription,
		PlanId:      plan.Id,
		CreatedTime: common.GetTimestamp(),
	}
	require.NoError(t, DB.Create(code).Error)

	result, err := Redeem("sub-code", user.Id)
	require.NoError(t, err)
	require.Equal(t, common.RedemptionTypeSubscription, result.Type)
	require.Equal(t, plan.Id, result.PlanId)
	require.Equal(t, "Pro", result.PlanTitle)
	require.NotZero(t, result.SubscriptionId)

	var sub UserSubscription
	require.NoError(t, DB.Where("user_id = ? AND plan_id = ?", user.Id, plan.Id).First(&sub).Error)
	require.Equal(t, "active", sub.Status)
	require.Equal(t, "redemption", sub.Source)
	require.Equal(t, plan.TotalAmount, sub.AmountTotal)
}

func TestRedeemSubscriptionCodeRejectsDisabledOrMissingPlan(t *testing.T) {
	setupRedemptionTestDB(t)
	user := createRedemptionTestUser(t, "reject-user")
	disabledPlan := createRedemptionTestPlan(t, false)
	cases := []Redemption{
		{
			Name:        "disabled",
			Key:         "disabled-plan-code",
			Status:      common.RedemptionCodeStatusEnabled,
			Type:        common.RedemptionTypeSubscription,
			PlanId:      disabledPlan.Id,
			CreatedTime: common.GetTimestamp(),
		},
		{
			Name:        "missing",
			Key:         "missing-plan-code",
			Status:      common.RedemptionCodeStatusEnabled,
			Type:        common.RedemptionTypeSubscription,
			PlanId:      disabledPlan.Id + 1000,
			CreatedTime: common.GetTimestamp(),
		},
	}
	require.NoError(t, DB.Create(&cases).Error)

	for _, tc := range cases {
		result, err := Redeem(tc.Key, user.Id)
		require.Nil(t, result)
		require.True(t, errors.Is(err, ErrRedeemFailed))

		var code Redemption
		require.NoError(t, DB.Where("key = ?", tc.Key).First(&code).Error)
		require.Equal(t, common.RedemptionCodeStatusEnabled, code.Status)
	}
}

func TestRedeemRejectsUsedAndExpiredCodes(t *testing.T) {
	setupRedemptionTestDB(t)
	user := createRedemptionTestUser(t, "used-user")
	codes := []Redemption{
		{
			Name:        "used",
			Key:         "used-code",
			Status:      common.RedemptionCodeStatusUsed,
			Quota:       100,
			CreatedTime: common.GetTimestamp(),
		},
		{
			Name:        "expired",
			Key:         "expired-code",
			Status:      common.RedemptionCodeStatusEnabled,
			Quota:       100,
			ExpiredTime: time.Now().Add(-time.Hour).Unix(),
			CreatedTime: common.GetTimestamp(),
		},
	}
	require.NoError(t, DB.Create(&codes).Error)

	for _, tc := range codes {
		result, err := Redeem(tc.Key, user.Id)
		require.Nil(t, result)
		require.True(t, errors.Is(err, ErrRedeemFailed))
	}
}
