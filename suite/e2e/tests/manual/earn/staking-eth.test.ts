import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('ETH staking', { tag: ['@group=manual'] }, () => {
    test(
        'ETH staking full flow - stake, unstake, claim',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the whole Ethereum staking lifecycle: stake, unstake and claim rewards.',
                prerequisites: [
                    'Seeded Trezor device (run with both BIP39 and SLIP39 seed when relevant)',
                    'Connected Trezor Suite',
                    'Funded Ethereum account, ideally with an existing stake and claimable rewards',
                ],
                steps: [
                    'Navigate to the funded Ethereum account and open the "Staking" tab',
                    'Click "Stake" (or "Start staking" for a first-time flow)',
                    'For first-time staking, confirm the "Staking in a nutshell" window, check "I acknowledge…" and continue',
                    'In the "Stake ETH" modal, confirm the "10%", "25%", "50%" and "Max" buttons populate the amount',
                    'Confirm the ETH and USD inputs are linked and editable',
                    'Change the fee between Normal, Low, High and Custom; confirm Custom fee can be edited',
                    'Continue, acknowledge the entry period and confirm',
                    'Confirm the "Stake ETH on Everstake" message on both Suite and the Trezor device and approve it',
                    'Confirm the staking transaction appears in the transaction history',
                    'Confirm "Total stake pending", "Staked" and "Rewards" values update correctly',
                    'Click "Unstake", confirm the unstake modal opens correctly formatted',
                    'Change the fee between Normal, Low, High and Custom, then confirm the unstake on the device',
                    'Confirm a new pending unstake transaction appears',
                    'Once rewards/unstaked funds are claimable, click "Claim"',
                    'Confirm the claim modal, adjust fee, continue and approve on the device',
                    'Confirm the claim transaction appears in history and the account balance is updated',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'ETH instant stake/unstake banner',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the instant stake/unstake banner is shown when a transaction is processed instantly.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Ethereum account with staking activity',
                ],
                steps: [
                    'Perform a stake or unstake on the Ethereum account',
                    'If the transaction is processed instantly by Everstake, confirm the instant stake/unstake banner appears',
                    'Confirm the transaction carries the "Instant" badge in the transaction history',
                    'Confirm the banner disappears after the transaction is fully processed',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
