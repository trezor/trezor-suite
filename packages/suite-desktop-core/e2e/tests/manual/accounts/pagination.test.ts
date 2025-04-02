import { TestAnnotationType, TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Pagination', { tag: ['@group=manual'] }, () => {
    test(
        'Pagination on accounts',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can navigate through the pages of transactions on an account.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'On "standard" wallet, navigate to the "Accounts"',
                        'Click on first account of "legacy" type',
                        'Go to the "5th" page of transactions via the "pagination component"',
                        'Verify that you’re indeed on "page 5"',
                        'Go to the "3rd" page of transactions via the "pagination component"',
                        'Verify, that you’re indeed on "page 3"',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Accounts,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Medium,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ],
        },
        async () => {},
    );
});
