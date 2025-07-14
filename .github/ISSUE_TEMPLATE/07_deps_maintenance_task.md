---
name: Dependencies maintenance task
about: Regular task for updating dependencies per each team domain.
title: 'Bump TEAM_NAME deps (YYYY.MM)'
labels: dependencies,
assignees: ''
---

<!--- Previous issue: optionally link the previous issue for visibility -->

## Developer checklist

- [ ] run `yarn list-outdated` for your team name (or run this to list all team names)
- [ ] one by one, update all listed outdated deps
    - [ ] commit separately for easier reverting (individually or grouped by related packages)
    - [ ] make sure the versions are consistent across all yarn workspaces
    - [ ] run `yarn dedupe`, consider impact carefully
    - [ ] pin exact versions when appropriate (use your best judgement)
- [ ] check the source repository for code changes if feasible, or changelog _at the very least_
    - [ ] carefully check any external code flagged by Socket Security
- [ ] ensure TS and CI tests are ✅
- [ ] besides CI tests, manually test affected parts of Trezor Suite, at least superficially
- [ ] _optionally_ create separate issue if a package is blocked or requires extensive refactoring

See [notion page](https://www.notion.so/satoshilabs/Dependency-Management-1b5bf845aa1f4ca7b9d57ea9ccd3fe63) for more details.

## QA instructions

🚧 not known yet, will be discovered – it depends on specific list of updated dependencies.

Please think about all the areas affected by each dependency, even on other platforms/other apps within monorepo.
