# GitHub Test Reporter

The GitHub Test Reporter is a unified test documentation and reporting framework designed to create a single source of truth for both automated and manual tests in our repository. This framework uses structured test annotations to document tests directly in the codebase and automatically generates GitHub project items during release for efficient QA regression testing and single overview of both manual and automated results of release testing.
Currently, the GitHub Test Reporter is used in Suite and Suite native.

## Purpose

The primary goals of this reporter are to:

1. **Unify Test Documentation** - Keep all test cases (both automated and manual) in one place within the repository
2. **Streamline QA Regression** - Populate a GitHub project with all tests as draft issues for release regression testing
3. **One overview of Release testing** - Github project contains results of both manual and regression release testing

When executed during release builds, the reporter adds new draft issues to a GitHub project. These issues contain all relevant test metadata and results, providing QA teams with a comprehensive dashboard for regression testing and quality assurance.

## How to run

Reporter no longer has automatic trigger. It needs to be triggered manually by running its orchestration workflow **[Test] Release Suite Report orchestration** which will run 3 relevant workflows (Web, Desktop and Manual). All automated tests will be run on the release again, their results reported to GitHub project and issues for manual regression will be generated as well.
You can also run the specific workflow one by one. Web and Desktop workflows needs to be run with parameter `publish_results_to_github set` to `true`.

## What to do when workflow fails

Each failed reporter run contains detailed instructions how to rerun it for specific set of tests and doing so creating complete report in our project without missing any tests.

## Overview

The framework consists of three main components:

1. **Test Annotations** - Define metadata about tests
2. **TestReportProvider** - Extracts and formats test metadata
3. **GitHub Reporter** - Populates GitHub project with test results as draft issues

## Annotation Types

Test annotations are defined in `testAnnotations.ts`, all of them are optional and include:

| Annotation Type | Description                                            |
| --------------- | ------------------------------------------------------ |
| `testCase`      | The title of the test                                  |
| `prerequisites` | List of requirements before running the test           |
| `steps`         | List of steps to execute the test                      |
| `category`      | Test category (e.g., Onboarding, Security, Wallets)    |
| `priority`      | Test priority (Critical, High, Medium, Low)            |
| `stream`        | Team assignment (Trends, Foundation, Engagement, etc.) |
| `deviceModel`   | Target device model (T1B1, T2T1, etc.)                 |
| `osMatrix`      | Operating systems to test on                           |

## Project Fields

The GitHub project is configured with fields that correspond to test metadata:

- **Status** - Test outcome (Todo, In Progress, Done PASS, Done FAIL, etc.)
- **Stream** - Team assignment
- **Test Run** - Whether the test is manual or automated (and which platform)
- **Priority** - Test importance
- **Device Model** - Target device for testing
- **Comment** - Additional notes
- **Release Build** - The release build identifier (branch-commit format)
- **OS Matrix** - Operating systems to test on (macOS ARM/Intel, Linux, Windows, Android)

## How to Use

### Adding Annotations to Tests

#### Suite workspace with Playwright

```typescript
test.describe('Test suite name', { tag: ['@group=manual'] }, () => {
    test(
        'My test case title',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify user can login with correct credentials',
                prerequisites: ['User has an existing account', 'Application is at login screen'],
                steps: [
                    'Enter valid username',
                    'Enter valid password',
                    'Click login button',
                    'Verify dashboard is displayed',
                ],
                category: TestCategory.Security,
                priority: TestPriority.High,
                stream: TestStream.Growth,
                deviceModel: DeviceModel.T2T1,
                osMatrix: [TestOsMatrix.Windows, TestOsMatrix.MacOSArm],
            }),
        },

        async () => {},
    );
});
```

#### Suite Native workspace with Jest/Detox

```typescript
import { it } from '../../support/wrappedIt';

describe.skip('Settings', () => {
    it(
        'Change currency',
        {
            testCase: 'Change currency in settings',
            prerequisites: ['Suite app with an Bitcoin account already imported'],
            steps: [
                'On bottom bar, click on "Settings gear" icon',
                'Click on "Localization"',
                'Change fiat "currency"',
                'Navigate to "Home" section',
                'Price of imported accounts changed accordingly',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
        },
        async () => {},
    );
});
```

### Configuration

The reporter is configured with environment variables:

- `GITHUB_TOKEN` - Required for API access
- `RELEASE_BUILD` - Used to identify the specific release build (format: branch-commit)
- `GITHUB_REPORTER_VERBOSE` - Set to control logging detail (false/true)

### Project Creation

The GitHub project used for testing reports must be created manually using the provided script:

```bash
yarn workspace @trezor/suite-e2e node ./support/reporters/scriptCreateProject.ts
```

This script creates a central "Trezor Suite release testing" project that will contain all test results. The project is reused across releases, with the `Release Build` field differentiating between builds.

### Local run

The reporter can be run from a local environment for troubleshooting and development purposes. Suite:

- `yarn workspace @trezor/suite-e2e test:e2e:web --reporter=./support/reporters/gitHubReporter.ts`
- `yarn workspace @trezor/suite-e2e test:e2e:desktop --reporter=./support/reporters/gitHubReporter.ts`
- `yarn workspace @trezor/suite-e2e github:report:manual`

Suite-native:

- `PUBLISH_RESULTS_TO_GITHUB=true yarn workspace @suite-native/app test:e2e android.emu.debug`
- `yarn workspace @suite-native/app github:report:manual`

## Implementation Notes

### Reporter Architecture

The **GitHubReporter** class handles:

1. **Initialization** - Setting up GitHub API access through Octokit
2. **Test Result Processing** - Creating or updating GitHub issues for each test, utilizes **TestReportProvider**
3. **Asynchronous Operation Management** - Tracking and ensuring completion of all API operations

The reporter creates separate issues for each operating system in the test's OS matrix, adding appropriate emojis to the title (🍏 macOS ARM, 🍎 macOS Intel, 🐧 Linux, 🪟 Windows, 🤖 Android).

The **TestReportProvider** abstract class provides a foundation for generating consistent test reports across different testing frameworks. It standardizes test metadata extraction and formatting by implementing shared logic for retrieving test annotations, generating descriptive content, and providing sensible defaults for test properties like category, priority, and device model. Platform-specific implementations extend this base class to integrate with their respective testing frameworks (e.g., Playwright, Jest) while inheriting common reporting functionality.

### Extending the Framework

To add new annotation types:

1. Add a new enum value in `TestAnnotationType`
2. Create a new annotation definition object
3. Add it to the appropriate arrays:
    - `annotationsForBodyDescription` - For issue body content
    - `annotationsForProjectFields` - For project board fields
    - `annotationsAddedToTest` - For annotations that can be set on tests
4. Update `TestReportProvider`
    - Add new getter for the new annotation
    - adds its default to class property defaults
    - update constant validGetterKeys in getterByKey

To add or change value of annotation, simply change or add new enum value in corresponding object in `testAnnotations.ts`

### Retry Strategy

The GitHub Test Reporter implements a retry mechanism to handle network issues or temporary API failures. It uses the `scheduleAction` utility. Each API operation will be attempted up to 5 times with a 500ms delay between attempts.
The current implementation does not have built-in deduplication logic for duplicate test issues created by `scheduleAction` retries or another workflow run.
We have implemented a random delay for action `create Draft Issue in Project` in order to distribute load and solve often issue "Your attempt to move this item created a temporary conflict. Please try again"

### Test Retry Deduplication

The reporter handles test retries by tracking previously created issues for each test. When a test is retried, the reporter updates the existing issue's status field rather than creating a duplicate issue. This ensures that each test case appears only once in the project board regardless of how many retry attempts occur.

### Release Build Differentiation

Tests from different release builds are added to the same GitHub project but are differentiated by the `Release Build` field. This allows filtering and organization of tests by specific releases while maintaining a centralized project structure.

### CI Integration

The reporter is integrated into release branch CI workflows:

- `test-suite-web-e2e-release.yml` for Suite Web tests
- `test-suite-desktop-e2e-release.yml` for Suite Desktop tests
- `test-suite-manual-release.yml` for Suite Sanity tests
- `test-suite-release-e2e-report-orchestration` servers to run all relevant workflows
- `test-suite-native-e2e-manual-reporter` for Suite native Sanity tests
- `test-suite-native-e2e-android.yml` for Suite native Android tests
- `test-suite-native-e2e-ios.yml` for Suite native iOS tests (wf is broken ATM so we cannot guarantee reporter is working)

Each workflow passes the `RELEASE_BUILD` and `GITHUB_TOKEN` environment variables to enable test reporting.
On the Web, Desktop, Android and iOS workflows, reporter is enabled only when workflow is run manually with param `publish_results_to_github` se to `true`. Otherwise only test are run. That way we have full control on the generation of issues in GitHub. We had a problem of duplicate and unwanted triggers when it was based on push to release branch.
