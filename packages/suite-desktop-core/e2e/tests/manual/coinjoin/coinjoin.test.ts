import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
    TestStream,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Coinjoin', { tag: ['@group=manual'] }, () => {
    test(
        'Add an existing CJ account',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can add an existing Coinjoin account to the Suite.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                        '"btc" network enabled',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'navigate to "Accounts"',
                        'in left sidebar, click on "+" sign next to "My accounts" header',
                        '"New account" modal should appear',
                        'select "Bitcoin" from coin selection',
                        'select "Coinjoin" account type from account selection',
                        'click on "Add account"',
                        'discovery of the new account finishes correctly',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.CoinJoin,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Low,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Foundation,
                },
            ],
        },
        async () => {},
    );

    test(
        'CJ custom setup page',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can adjust the privacy level of a Coinjoin account.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                        '"btc" network enabled',
                        'A CJ account added',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to "Accounts"',
                        'Click on "Details"',
                        'Click on "Custom" input option',
                        'The default "privacy level" is set to "5"',
                        'In the privacy input, change the number to "8"',
                        'Slider correctly adjusts',
                        'Adjust the slider to "4"',
                        'Input correctly adjusts',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.CoinJoin,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Low,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Foundation,
                },
            ],
        },
        async () => {},
    );
});
