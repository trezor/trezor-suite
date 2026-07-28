import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('TRX staking', { tag: ['@group=manual'] }, () => {
    test(
        'TRX staking full flow - freeze, vote, claim, unfreeze, withdraw',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the whole Tron staking lifecycle: freeze, vote, claim rewards, unfreeze and withdraw.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Tron account, ideally with an existing frozen stake and claimable rewards',
                ],
                steps: [
                    'Navigate to the funded Tron account and open the "Staking" tab',
                    'In the network tab, confirm the expected call to the backend "/report" endpoint is made',
                    'Start the "Freeze" flow, fill the amount (check percentage/Max buttons) and continue',
                    'Confirm the freeze transaction on the Trezor device',
                    'Confirm the frozen balance and gained energy/bandwidth are displayed correctly',
                    'Start the "Vote" flow and vote for a validator with the frozen TRX',
                    'Confirm the vote on the device and confirm the vote is displayed in the staking overview',
                    'Once rewards are available, click "Claim" and confirm the claim on the device',
                    'Confirm claimed rewards are added to the account balance',
                    'Start the "Unfreeze" flow, fill the amount and confirm on the device',
                    'Confirm the unfreezing period is displayed correctly',
                    'After the unfreezing period, click "Withdraw" and confirm on the device',
                    'Confirm the withdrawn funds are returned to the available balance',
                ],
                category: TestCategory.Coins,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
