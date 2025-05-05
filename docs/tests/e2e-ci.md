# E2E tests CI pipelines for Trezor Suite web and desktop

Let's have a look at how CI pipelines for E2E tests are set up.

## Test runner + reporting

We are using Playwright in combination with Currents.dev to run and orchestrate our E2E tests. All pipelines mentioned in this document have a desktop and web version. Their flows are identical, the only difference is which version of the app is tested.

### Features

- Currents reporting - Test reports and very useful statistics are available in https://app.currents.dev/
- Currents orchestration - Tests are running in parallel groups and the tests are dynamically distributed to these groups to optimize execution time.
- Configurable fail fast - If a given number of tests fails, all the parallel groups are terminated and the rest of the testing is skipped. This is used to save resources and time in case of heavily broken build.
- Test retries - The test runner is configured to perform up to two retries (i.e. maximum of 3 runs) to deal with test flakiness

### Note manual workflow reruns and orchestration

Due to the dynamic distribution of tests to the groups, we advise you to always use the option to rerun all jobs and never only the failed ones. That is because the orchestration would have less workers to run the tests and it would cause your test execution to be unnecessarily long.

#### When to use manual reruns

Please use manual workflow rerun in case you've made significant and dangerous changes in subsequent pushes after your tests already passed once and would be skipped.

#### When to NEVER use manual reruns

You should never need to manually rerun tests, because you think the fail is caused by flakiness. This is already solved by the built-in retries and the fail is most likely real and will occur again in the rerun.

## Pull request pipeline

### Description and usage

This is the most commonly triggered pipeline, because it runs as part of each PR verification. It is optimized to save resources, when tests already successfully passed.

### Triggers

- Open PR
- Push to PR

### Flow

This CI pipeline decides whether to build app and run E2E tests following this logic:

#### 🔹 Is First Attempt?

- **Yes** (e.g. initial run after a push):

    - **Check Previous Test Runs**:
        - ✅ **If a previous successful run exists**:
            - 🛑 **Skip Build**
            - 🛑 **Skip Tests**
        - ❌ **If no successful run exists (failed or incomplete)**:
            - 🔄 **Run Build**
            - ✅ **Run All Tests**

- **No** (e.g. a manual rerun of the same workflow run):
    - 🔄 **Run Build**
    - ✅ **Run All Tests**

#### Flowchart representation:

![CI Workflow Diagram](./e2e-ci-diagram.png)

## Nightly and FW canary pipelines

### Description and usage

These pipelines are running nightly scheduled tests on develop branch. The FW canary is using firmware built from main branch to verify the latest build.

### Triggers

- Cron

### Test runner configuration

- Fail fast disabled

### Flow

The pipeline always runs all the tests with no additional logic.

## Release pipeline

### Description and usage

This pipeline serves as a release candidate verification.

### Triggers

- Push to release branch

### Test runner configuration

- Fail fast disabled

### Flow

The pipeline always runs all the tests with no additional logic.
