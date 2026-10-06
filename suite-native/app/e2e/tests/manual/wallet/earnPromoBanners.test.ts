import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Earn promo banners on home screen',
        {
            testCase:
                'Earn promo banners are displayed on the home screen and navigate to the right flows',
            prerequisites: [
                'connected device',
                'seed with ETH and SOL funds eligible for earn opportunities',
            ],
            steps: [
                'Open the home screen and verify the earn promo banners are displayed (ETH vault, DeFi yield, SOL staking)',
                'Tap the banner and verify the app navigates to the corresponding earn flow',
                'Dismiss a banner and verify it stays hidden after the app is restarted',
                'Verify earnable assets on the home screen display the Earn badge',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.Medium,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
