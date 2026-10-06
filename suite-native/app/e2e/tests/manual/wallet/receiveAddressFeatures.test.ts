import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Receive address history and verification guard',
        {
            testCase:
                'Receive shows previously generated addresses and guards address verification',
            prerequisites: ['connected device', 'seed with BTC and ETH funds on it'],
            steps: [
                'Navigate to a BTC account and open the receive flow',
                'Generate a fresh address and verify it on the device',
                'Reopen the receive flow and verify the previously generated addresses are listed in the address history',
                'Verify a used address is marked as used in the history',
                'Try to reveal an address without confirming it on the device and verify the verification guard prevents it',
                'Navigate to an ETH account, open the receive flow and verify the Ethereum receive address info is displayed',
                'Verify the ETH address stays the same across repeated receive flows',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
