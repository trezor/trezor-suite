import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Coinjoin', { tag: ['@group=manual'] }, () => {
    test(
        'Add an existing CJ account',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can add an existing Coinjoin account to the Suite.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                        '"btc" network enabled',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'navigate to "Accounts"',
                        'in left sidebar, click on "+" sign next to "My accounts" header',
                        '"New account" modal should appear',
                        'select "Bitcoin" from coin selection',
                        'select "Coinjoin" account type from account selection',
                        'click on "Add account"',
                        'discovery of the new account finishes correctly'
                    ]),
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
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can adjust the privacy level of a Coinjoin account.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                        '"btc" network enabled',
                        'a CJ account added',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'navigate to "Accounts"',
                        'click on "Details"',
                        'click on "Custom" input option',
                        'the default "privacy level" is set to "5"',
                        'in the privacy input, change the number to "8"',
                        'slider correctly adjusts',
                        'adjust the slider to "4"',
                        'input correctly adjusts',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
