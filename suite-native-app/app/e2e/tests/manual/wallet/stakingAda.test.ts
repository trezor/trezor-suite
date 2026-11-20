import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'ADA staking overview (read-only)',
        {
            testCase:
                'Cardano staking created on desktop is displayed on mobile and cannot be managed there',
            prerequisites: [
                'connected device',
                'seed with an ADA account delegated to the Everstake pool in Trezor Suite on desktop',
            ],
            steps: [
                'Navigate to the Earn screen and verify the ADA staking position is listed with its APY',
                'Open the ADA staking position and verify the staking management screen is displayed',
                'Verify the banner says staking ADA can only be managed in Trezor Suite on desktop',
                'Verify the staked amount equals the whole account balance and carries the "Auto-staked" badge',
                'Verify the rewards match Trezor Suite on desktop',
                'Verify no "Stake" or "Unstake" button is offered',
                'Tap "Learn more" on the staked card and verify the sheet explains that the whole balance earns rewards',
                'Tap "Learn more" in the sheet and verify the Cardano staking help article opens',
                'Verify the Cardano staking transactions are listed under "Staking transactions"',
            ],
            category: TestCategory.ADA,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'ADA staking with an outdated or external pool',
        {
            testCase:
                'Cardano accounts delegated to an outdated or external pool are communicated correctly',
            prerequisites: [
                'connected device',
                'seed with an ADA account delegated to the outdated FiveBinaries pool',
                'seed with an ADA account delegated to a pool outside Trezor Suite',
            ],
            steps: [
                'Navigate to the Earn screen with the FiveBinaries account and verify the "no longer earning rewards" banner is displayed',
                'Verify the ADA position carries the "No rewards" badge instead of an APY',
                'Open the staking management screen and verify the same warning banner is displayed',
                'Tap "Learn more" on the banner and verify the provider update help article opens',
                'Open the staking management screen of the externally delegated account',
                'Verify the "Delegated outside Trezor Suite" banner is displayed below the staked card',
            ],
            category: TestCategory.ADA,
            priority: TestPriority.Medium,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
