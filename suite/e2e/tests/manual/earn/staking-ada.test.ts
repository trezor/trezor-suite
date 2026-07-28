import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('ADA staking', { tag: ['@group=manual'] }, () => {
    test(
        'ADA staking full flow - stake, unstake, claim rewards',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the whole Cardano staking lifecycle: delegate, withdraw rewards and undelegate.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Cardano account, ideally already delegated with pending rewards',
                ],
                steps: [
                    'Navigate to the funded Cardano account and open the "Staking" tab',
                    'Click "Stake" / "Delegate" and confirm fees and estimated gains are calculated correctly',
                    'Confirm the delegation on the Trezor device',
                    'Confirm a success notification is rendered and the delegation transaction appears in history',
                    'Once rewards are available, click "Claim rewards" / "Withdraw"',
                    'Confirm the withdrawal on the device and confirm the rewards are added to the balance',
                    'Unstake (undelegate) the funds and confirm on the device',
                    'Confirm the unstake transaction is created and the staking state updates',
                ],
                category: TestCategory.ADA,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'ADA change delegate and update provider',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can change the DRep delegate and update the staking provider.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Cardano account with an active delegation',
                ],
                steps: [
                    'Navigate to the delegated Cardano account "Staking" tab',
                    'Start the change delegate flow and select a different DRep for voting rights',
                    'Confirm the change on the Trezor device',
                    'Confirm the delegate change transaction appears in history',
                    'If an "Update provider" / redelegation prompt is displayed (pool change), start it',
                    'Confirm the redelegation on the device and confirm the new pool is displayed after confirmation',
                    'Confirm the "stake with another provider" promo is displayed',
                ],
                category: TestCategory.ADA,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'ADA FiveBinaries warning',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the FiveBinaries warning is displayed for Cardano staking.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Cardano account with staking available',
                ],
                steps: [
                    'Navigate to the Cardano account "Staking" tab',
                    'Confirm the FiveBinaries warning/notice is displayed where applicable',
                    'Confirm the warning text is correct and any link opens the right resource',
                ],
                category: TestCategory.ADA,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
