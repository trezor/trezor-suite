# GitHub Test Reporter

The GitHub Test Reporter is a unified test documentation and reporting framework designed to create a single source of truth for both automated and manual tests in our repository. This framework uses structured test annotations to document tests directly in the codebase and automatically generates GitHub projects during release builds for efficient QA workflows.

## Purpose

The primary goals of this reporter are to:

1. **Unify Test Documentation** - Keep all test cases (both automated and manual) in one place within the repository
2. **Streamline QA Regression** - Generate release-specific project boards with all tests as draft issues

When executed during release builds, the reporter creates a new GitHub project populated with draft issues representing each test. These issues contain all relevant test metadata and results, providing QA teams with a comprehensive dashboard for regression testing and quality assurance.

## Overview

The framework consists of three main components:

1. **Test Annotations** - Define metadata about tests
2. **TestReportProvider** - Extracts and formats test metadata
3. **GitHub Reporter** - Creates release build project and populates it with GitHub issues with test results

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
-   `PROJECT_NAME` - Optional name for the GitHub project (defaults to "Test Results 35")
-   `VERBOSE` - Set to control logging detail

### Local run

The reporter can be run even from local environment for troubleshooting and development purposes.

-   `yarn test:e2e:web:report`
-   `yarn test:e2e:desktop:report`

## Implementation Notes

### Retry Strategy

The GitHub Test Reporter implements a retry mechanism to handle network issues or temporary API failures. It uses the `scheduleAction` utility. Each API operation will be attempted up to 3 times with a 500ms delay between attempts.
The current implementation does not have built-in deduplication logic for test issues.

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
