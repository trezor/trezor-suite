import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Btc transactions', { tag: ['@group=manual'] }, () => {
    test(
        'Confirm & Send a BTC Transaction with a fee bump',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description: 'Verifies that a user can send a BTC transaction with a fee bump.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed)',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'navigate to the "Accounts"',
                        'in accounts overview (left panel), click on any other account than the one with the most funds',
                        'get a "recieve BTC address" of the account chosen in step 2 (lets call it account A)',
                        'confirm address on the device',
                        'in the accounts overview, select the account with most funds (lets call it account B)',
                        'Test "Send all" button, that its present and responds as expected',
                        'send some funds (eg. $1) to the stored BTC address of account A, select a "low" fee',
                        'you should see the pending transaction in both accounts A and B',
                        'in the sending account (account B), click on the pending transaction you just made',
                        'a transaction "Details" modal will open',
                        'click on "bump fee" and sub-window should appear',
                        'change the fee to "High" and click on "Replace transaction"',
                        'modal should close',
                        'a success toast notification should appear',
                        'make sure the transaction is actually mined after some minutes',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
