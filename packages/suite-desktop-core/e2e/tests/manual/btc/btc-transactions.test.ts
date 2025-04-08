import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Btc transactions', { tag: ['@group=manual'] }, () => {
    test(
        'Confirm & Send a BTC Transaction with a fee bump',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can send a BTC transaction with a fee bump.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'In accounts overview (left panel), click on any other account than the one with the most funds',
                    'Get a "recieve BTC address" of the account chosen in step 2 (lets call it account A)',
                    'Confirm address on the device',
                    'In the accounts overview, select the account with most funds (lets call it account B)',
                    'Test "Send all" button, that its present and responds as expected',
                    'Send some funds (eg. $1) to the stored BTC address of account A, select a "low" fee',
                    'You should see the pending transaction in both accounts A and B',
                    'In the sending account (account B), click on the pending transaction you just made',
                    'A transaction "Details" modal will open',
                    'Click on "bump fee" and sub-window should appear',
                    'Change the fee to "High" and click on "Replace transaction"',
                    'Modal should close',
                    'A success toast notification should appear',
                    'Make sure the transaction is actually mined after some minutes',
                ],
                category: TestCategory.BTC,
                priority: TestPriority.Critical,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );
});
