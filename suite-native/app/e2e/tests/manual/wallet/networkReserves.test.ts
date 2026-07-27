import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Network reserve check',
        {
            testCase: 'Network reserve check can be toggled and reserves are respected in send',
            prerequisites: ['connected device', 'seed with Base/Optimism/RHC/SOL funds on it'],
            steps: [
                'Navigate to Settings > Advanced and locate the network reserve check toggle',
                'Verify the toggle is enabled by default',
                'Navigate to an Base/Optimism/RHC/SOL account, open the send form and try to send an amount that would break the reserve',
                'Verify the reserve requirement warning is shown',
                'Disable the reserve check in Settings and verify the send form no longer enforces it',
                'Enable the toggle back',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
