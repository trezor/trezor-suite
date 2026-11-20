import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'View only (remember device) enable',
        {
            testCase: 'View only (remember device) enable',
            prerequisites: ['connected device', 'updated Suite Lite'],
            steps: [
                'Connect device and go through initial onboarding',
                'Wait for discovery of standard wallet and enable view-only when modal appears',
                'Verify notification about enabling appears',
                'Open Settings → View only and verify view-only for standard wallet is enabled',
                'Disconnect device and verify balances remain visible and Disconnected text appears in device switcher',
            ],
            category: TestCategory.Device,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
