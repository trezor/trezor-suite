import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Pagination', { tag: ['@group=manual'] }, () => {
    test(
        "Pagination on accounts",
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        "Verifies that a user can navigate through the pages of transactions on an account.",
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'on "standard" wallet, navigate to the "Accounts"',
                        'click on first account of "legacy" type',
                        'go to the "5th" page of transactions via the "pagination component"',
                        'verify that you’re indeed on "page 5"',
                        'go to the "3rd" page of transactions via the "pagination component"',
                        'verify, that you’re indeed on "page 3"',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
