import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Internal transaction

test.describe.skip('Eth transactions Internal transaction', { tag: ['@group=manual'] }, () => {
    test(
        'Perform Ethereum transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can perform Ethereum transactions in the Suite.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Transaction history is present',
                    'Select random internal transaction in the transaction history',
                    'Transaction details are present in both transaction history and transaction detail',
                    'Close transaction detail',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
