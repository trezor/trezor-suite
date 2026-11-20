import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'TRX staking overview (read-only)',
        {
            testCase:
                'Tron staking created on desktop is displayed on mobile and cannot be managed there',
            prerequisites: [
                'connected device',
                'seed with a TRX account with frozen TRX, unassigned votes, a pending unstake and unstaked TRX ready to withdraw (prepared in Trezor Suite on desktop)',
            ],
            steps: [
                'Navigate to the Earn screen and verify the TRX staking position is listed with its rate labelled as APR',
                'Verify the unassigned votes alert is displayed on the TRX position',
                'Open the TRX staking position and verify the staking management screen is displayed',
                'Verify the staked amount and rewards match Trezor Suite on desktop',
                'Verify no "Stake" or "Unstake" button is offered',
                'Verify the "ready to withdraw" banner shows the unstaked amount',
                'Verify the "Unstaking" card shows the total pending amount, expand it and verify each unstake is listed with its amount and remaining time',
                'Verify the "Resources" card shows Bandwidth and Energy as available / total',
                'Tap the unassigned votes warning and verify the sheet says staking is managed in Trezor Suite for desktop',
                'On an account with all votes assigned, verify the "Resources" card shows the assigned votes count without a warning',
                'Verify the Tron staking transactions are listed under "Staking transactions"',
            ],
            category: TestCategory.Staking,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
