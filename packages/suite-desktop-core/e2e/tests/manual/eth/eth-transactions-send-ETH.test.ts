import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Transaction types
// Send ETH

test.describe.skip('Eth transactions', { tag: ['@group=manual'] }, () => {
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
                    'Transaction history graph is rendered as expected',
                    'Select random transaction',
                    'Transaction details are present in both transaction history and transaction detail',
                    'Close transaction detail',
                    'Click receive button',
                    'Click on "Show full address" button',
                    'Receive address and QR code is displayed',
                    'Scan and compare QR code on device and in Suite',
                    'Confirm address on Device',
                    'Press "Copy address button"',
                    'Navigate to different account that holds funds',
                    'Click on "Send" button',
                    'Fill out Address field with copied address and amount field',
                    '"Review & Send transaction" via Suite and device button',
                    'Bump transaction fee of already sent transaction',
                    'Make sure it is mined',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
