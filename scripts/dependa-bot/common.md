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
