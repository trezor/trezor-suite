import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Coinjoin', { tag: ['@group=manual'] }, () => {
    test(
        'Add an existing CJ account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can add an existing Coinjoin account to the Suite.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                    '"btc" network enabled',
                ],
                steps: [
                    'navigate to "Accounts"',
                    'in left sidebar, click on "+" sign next to "My accounts" header',
                    '"New account" modal should appear',
                    'select "Bitcoin" from coin selection',
                    'select "Coinjoin" account type from account selection',
                    'click on "Add account"',
                    'discovery of the new account finishes correctly',
                ],
                category: TestCategory.CoinJoin,
                priority: TestPriority.Low,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );

    test(
        'CJ custom setup page',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can adjust the privacy level of a Coinjoin account.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                    '"btc" network enabled',
                    'A CJ account added',
                ],
                steps: [
                    'Navigate to "Accounts"',
                    'Click on "Details"',
                    'Click on "Custom" input option',
                    'The default "privacy level" is set to "5"',
                    'In the privacy input, change the number to "8"',
                    'Slider correctly adjusts',
                    'Adjust the slider to "4"',
                    'Input correctly adjusts',
                ],
                category: TestCategory.CoinJoin,
                priority: TestPriority.Low,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );
});
