import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('SOL staking', { tag: ['@group=manual'] }, () => {
    test(
        'SOL staking full flow - stake, unstake, claim',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies the whole Solana staking lifecycle: stake, unstake and claim.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Solana account, ideally with an existing stake',
                ],
                steps: [
                    'Navigate to the funded Solana account and open the "Staking" tab',
                    'Confirm stake created outside of Trezor Suite is listed in the staking overview',
                    'Click "Stake" (or "Start staking" for a first-time flow)',
                    'For first-time staking, confirm the "Staking in a nutshell" window, check "I acknowledge…" and continue',
                    'In the "Stake SOL" modal, confirm the "10%", "25%", "50%" and "Max" buttons populate the amount',
                    'Confirm the SOL and USD inputs are linked and editable',
                    'Continue, acknowledge the entry period and confirm',
                    'Confirm the "Stake SOL on Everstake" message on the Trezor device and approve it',
                    'Confirm the staking transaction appears in history and stake balances update',
                    'Click "Unstake", fill the amount and confirm the unstake on the device',
                    'Confirm the unstake appears as pending and the stake enters the deactivation period',
                    'Once funds are deactivated, click "Claim" and approve the claim on the device',
                    'Confirm claimed funds are returned to the available account balance',
                ],
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'SOL external staking',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that stake accounts delegated outside of Trezor Suite are displayed.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Solana account with a stake delegated to a validator other than Everstake (created externally)',
                ],
                steps: [
                    'Navigate to the Solana account with external staking and open the "Staking" tab',
                    'Confirm the externally delegated stake is listed with its validator',
                    'Confirm the external stake amount is included in the account staking overview',
                    'Confirm Suite communicates which actions are (not) available for the external stake',
                ],
                category: TestCategory.Solana,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'SOL rewards history',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that Solana staking rewards history is displayed.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Solana account with a stake that has already earned rewards',
                ],
                steps: [
                    'Navigate to the Solana account and open the "Staking" tab',
                    'Locate the rewards history section',
                    'Confirm past reward payouts are listed with epoch/date and amount',
                    'Confirm the total rewards value matches the sum of listed payouts',
                ],
                category: TestCategory.Solana,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'SOL staking rewards warning',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the staking rewards warning is displayed for Solana staking.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Solana account eligible for the staking rewards warning',
                ],
                steps: [
                    'Navigate to the Solana account "Staking" tab',
                    'Confirm the staking rewards warning banner is displayed where applicable',
                    'Confirm the warning text explains the rewards condition correctly',
                    'Confirm any link in the warning opens the correct resource',
                ],
                category: TestCategory.Solana,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
