import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Custom Electrum and RPC backends',
        {
            testCase:
                'A custom Electrum and a custom RPC backend can be set and the app connects to them',
            prerequisites: [
                'connected device',
                'seed with BTC and ETH funds on it',
                'URL of a working Electrum server (host:port:s or host:port:t)',
                'URL of a working EVM RPC endpoint',
            ],
            steps: [
                'Navigate to Settings → Enabled coins and open the backends screen of Bitcoin',
                'Select Electrum, enter the working Electrum URL and confirm',
                'Wait for connection and verify BTC accounts still load and sync via Electrum',
                'Enter an invalid Electrum URL and verify a validation or connection error is shown',
                'Revert Bitcoin to the default backend and verify the app reconnects',
                'Open the backends screen of Ethereum',
                'Select RPC, enter the working RPC URL and confirm',
                'Wait for connection and verify ETH accounts still load and sync via the custom RPC',
                'Enter an invalid RPC URL and verify a validation or connection error is shown',
                'Revert Ethereum to the default backend and verify the app reconnects',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Network,
        },
        async () => {},
    );
});
