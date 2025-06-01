import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Transaction types
// Send NFT and check change in Suite

test.describe.skip('Eth transactions NFT', { tag: ['@group=manual'] }, () => {
    test(
        'View Ethereum transaction history and details, including NFT transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can view NFT transaction history',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Transaction history is present',
                    'find NFT transaction in the transaction history',
                    'Select NFT transaction',
                    'Transaction details are present in both transaction history and transaction detail',
                    'Close transaction detail',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Low,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );

    test(
        'Transfer NFT using MetaMask and verify in Trezor Suite',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that an NFT transfer using MetaMask is reflected correctly in Trezor Suite.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                    'MetaMask wallet installed and configured',
                    'NFT available in MetaMask wallet',
                ],
                steps: [
                    'Open MetaMask and log in',
                    'Navigate to the NFT section in MetaMask',
                    'Select an NFT to transfer',
                    'Enter recipient address (Trezor Suite account)',
                    'Confirm the transaction in MetaMask',
                    'Wait for the transaction to be mined',
                    'Open Trezor Suite and navigate to the Ethereum account',
                    'Verify the NFT transfer is reflected in the transaction history',
                    'Check the NFT details in Trezor Suite',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Low,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
