import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Send form ETH',
        {
            testCase: 'Send form ETH',
            prerequisites: ['connected device', 'seed with funds on it'],
            steps: [
                'Navigate to ETH assets and select another account than the one with most funds',
                'Click Receive, copy address and confirm on device',
                'Select account with most funds and click Send',
                'Enter address and amount, verify fiat/ETH values and switching between fields',
                'Continue to fee selection (one fee shown) and verify recipient and totals',
                'Continue to Review and sign, approve on device and verify recipient ticked',
                'Approve and send transaction; verify transaction detail shows Pending',
                'Repeat procedure for tokens',
            ],
            category: TestCategory.Device,
            priority: TestPriority.Critical,
            stream: TestStream.Wallet,
        },
        async () => {},
    );

    it(
        'Ethereum recipient checksum conversion with and without transaction history',
        {
            testCase: 'Verify ETH recipient checksum handling in the mobile Send form',
            prerequisites: [
                'Connected Trezor and a funded Ethereum account',
                'Two Ethereum wallet addresses with known mixed-case checksums: one with transaction history and one with no history',
            ],
            steps: [
                'In the ETH Send form, paste the used address in lowercase. Verify it changes to the expected checksum automatically without a conversion alert',
                'Paste the unused address in lowercase. Verify Suite shows the checksum alert. Tap "Convert" and verify the address matches the expected checksum',
                'Paste the same unused address already checksummed. Verify it stays exactly as pasted and no conversion alert appears',
                'For each case, enter an ETH amount and continue to "Review and sign". Verify the expected recipient appears on the Trezor, then cancel on the device',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.Low,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
