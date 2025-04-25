import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Pagination', { tag: ['@group=manual'] }, () => {
    test(
        'Pagination on accounts',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can navigate through the pages of transactions on an account.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'On "standard" wallet, navigate to the "Accounts"',
                    'Click on first account of "legacy" type',
                    'Go to the "5th" page of transactions via the "pagination component"',
                    'Verify that you’re indeed on "page 5"',
                    'Go to the "3rd" page of transactions via the "pagination component"',
                    'Verify, that you’re indeed on "page 3"',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
            }),
        },
        async () => {},
    );
});
