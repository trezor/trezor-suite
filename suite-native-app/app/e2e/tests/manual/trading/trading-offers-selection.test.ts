import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Compare all offers functionality',
        {
            testCase: 'Verifies the Compare all offers flow in mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a wallet connected',
                'Proceed through Buy, Sell, or Swap form and tap Continue to reach offers selection',
            ],
            steps: [
                'Observe offers loading state',
                'Verify offers are loaded and displayed',
                'Verify Trade history action is present',
                'Open Provider button and verify provider list is displayed',
                'Sort offers by best rate or lowest fee (if available)',
                'Filter by provider type (CEX and DEX where available)',
                'Filter by KYC options (if available)',
                'Check one offer details including fee and rate breakdown',
                'Select one offer and verify transition to provider confirmation flow',
                'Wait for offers refresh and verify list updates',
            ],
            category: TestCategory.General,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
