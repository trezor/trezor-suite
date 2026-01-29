import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Cardano staking', { tag: ['@group=manual'] }, () => {
    test(
        'Cardano staking',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can delegate funds or withdraw staking rewards on the Cardano network.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite app with a funded wallet connected',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select or enable and then Select "Cardano"',
                    'Select account with funds and staking present',
                    'Navigate to "Staking" tab',
                    'Withdraw staking rewards',
                    'Success notification is rendered in Trezor Suite',
                    'Unstake funds',
                    'Wait for unstake transaction to be confirmed',
                    'Stake funds',
                    'During staking process delegate the voting rights to different drep',
                    'Check if fees are loaded correctly and estimated gains are calculated correctly',
                    'Wait for staking transaction to be confirmed',
                ],
                category: TestCategory.ADA,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
