# Merge upstream updates

## Goal

Check whether this repository has a GitHub remote, fetch upstream changes, and merge them into the current branch if updates exist.

## What I already know

* User asked: currently has GitHub repo? upstream has updates, merge them.
* Git status injected at session start was clean on branch main.

## Assumptions

* Work on the current branch unless repository configuration proves otherwise.
* Prefer the tracked upstream branch for this local branch.
* If there is a separate upstream remote, inspect it before deciding merge source.

## Requirements

* Inspect remotes and current branch tracking.
* Fetch remote refs.
* Merge upstream updates when the current branch is behind.
* Do not push.
* Stop and report if conflicts require manual judgment.

## Acceptance Criteria

* [ ] Remote configuration is checked.
* [ ] Fetch succeeds or failure is reported.
* [ ] Current branch is merged with the correct upstream source when behind.
* [ ] Final git status is clean or conflicts are clearly reported.

## Out of Scope

* No push.
* No dependency install.
* No code refactor.

## Technical Notes

* This is a Git maintenance task, not a code change.
