import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Earn page',
        {
            testCase: 'The Earn screen lists staking and yield opportunities with APY breakdown',
            prerequisites: ['connected device', 'seed with ETH and SOL funds on it'],
            steps: [
                'Navigate to the Earn screen',
                'Verify eligible accounts are listed with staking and yield opportunities',
                'Open the APY detail/breakdown and verify it explains how the APY is composed',
                'Open the "How staking works" info and verify it is displayed correctly',
                'Open the "How yield works" info and verify it is displayed correctly',
                'Tap a staking opportunity and verify the app navigates to the staking flow',
                'Tap a yield opportunity and verify the app navigates to the yield flow',
                'With bonus rewards available, verify they are displayed on the Earn screen and can be claimed',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
