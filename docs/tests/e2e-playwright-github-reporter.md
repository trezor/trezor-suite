# GitHub Test Reporter

The GitHub Test Reporter is a unified test documentation and reporting framework designed to create a single source of truth for both automated and manual tests in our repository. This framework uses structured test annotations to document tests directly in the codebase and automatically generates GitHub project items during release builds for efficient QA workflows.

## Purpose

The primary goals of this reporter are to:

1. **Unify Test Documentation** - Keep all test cases (both automated and manual) in one place within the repository
2. **Streamline QA Regression** - Populate a GitHub project with all tests as draft issues for release regression testing

When executed during release builds, the reporter adds new draft issues to a GitHub project. These issues contain all relevant test metadata and results, providing QA teams with a comprehensive dashboard for regression testing and quality assurance.

## Overview

The framework consists of three main components:

1. **Test Annotations** - Define metadata about tests
2. **TestReportProvider** - Extracts and formats test metadata
3. **GitHub Reporter** - Populates GitHub project with test results as draft issues

The reporter automatically creates draft issues in a GitHub project board when tests run, complete with test metadata, status, and other customizable fields.

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

## Project Fields

The GitHub project is configured with fields that correspond to test metadata:

-   **Status** - Test outcome (Todo, In Progress, Done PASS, Done FAIL, etc.)
-   **Stream** - Team assignment
-   **Test Run** - Whether the test is manual or automated (and which platform)
-   **Priority** - Test importance
-   **Device Model** - Target device for testing
-   **Comment** - Additional notes
-   **Release Build** - The release build identifier (branch-commit format)

## How to Use

### Adding Annotations to Tests

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
                stream: TestStream.Foundation,
            }),
        },

        async ({ page }) => {},
    );
});
```

### Configuration

The reporter is configured with environment variables:

-   `GITHUB_TOKEN` - Required for API access
-   `RELEASE_BUILD` - Used to identify the specific release build (format: branch-commit)
-   `VERBOSE` - Set to control logging detail

### Project Creation

The GitHub project used for testing reports must be created manually using the provided script:

```bash
yarn workspace @trezor/suite-desktop-core node e2e/support/reporters/scriptCreateProject.ts
```

This script creates a central "Trezor Suite release testing" project that will contain all test results. The project is reused across releases, with the `Release Build` field differentiating between builds.

### Local run

The reporter can be run from a local environment for troubleshooting and development purposes:

-   `yarn test:e2e:web --reporter=./e2e/support/reporters/gitHubReporter.ts`
-   `yarn test:e2e:desktop --reporter=./e2e/support/reporters/gitHubReporter.ts`
-   `yarn test:e2e:manual`

## Implementation Notes

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

The GitHub Test Reporter implements a retry mechanism to handle network issues or temporary API failures. It uses the `scheduleAction` utility. Each API operation will be attempted up to 3 times with a 500ms delay between attempts.
The current implementation does not have built-in deduplication logic for duplicate test issues created by `scheduleAction` retries.

### Test Retry Deduplication

The reporter handles test retries by tracking previously created issues for each test. When a test is retried, the reporter updates the existing issue's status field rather than creating a duplicate issue. This ensures that each test case appears only once in the project board regardless of how many retry attempts occur.

### Release Build Differentiation

Tests from different release builds are added to the same GitHub project but are differentiated by the `Release Build` field. This allows filtering and organization of tests by specific releases while maintaining a centralized project structure.

### CI Integration

The reporter is integrated into release branch CI workflows:

-   `test-suite-web-e2e-release.yml` for Suite Web tests
-   `test-suite-desktop-e2e-release.yml` for Suite Desktop tests
-   `test-suite-manual-release.yml` for manual tests

Each workflow passes the `RELEASE_BUILD` and `GITHUB_TOKEN` environment variables to enable test reporting.
