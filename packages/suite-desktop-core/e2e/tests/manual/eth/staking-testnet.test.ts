import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Ethereum staking on testnet', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake Ethereum on the Holesky testnet.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed"',
                    'Connected Trezor Suite',
                    'Funded Holesky Testnet account',
                ],
                steps: [
                    'Navigate to funded Ethereum Holesky account',
                    'Go to Staking tab and click "Start staking" bu“ton',
                    '“Staking in a nutsh“ll” window appears” proceed to “I acknowledge and…” checkbox, Confirm',
                    '"Stake Ethereum" modal opens',
                    'Confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                    'Populate ETH and USD input field',
                    'Change fee between "Normal" and "Custom", confirm that "Custom" fee can be “hanged',
                    'Click Contin“e button',
                    '"Confirm entry“period" modal ”pens',
                    'Select “I acknowledge…” checkbox',
                    'Confirm & stake',
                    'Confirm that Trezor device got "Stake ETH on Everstake" message',
                    'Touch Confirm button',
                    'Confirm that transaction appears in transaction history',
                    'Confirm "Total stake pending", "Stake" and "Rewards" values are correct',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );

    test(
        'Ethereum unstaking',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake Ethereum on the Holesky testnet.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed"',
                    'Connected Trezor Suite',
                    'Funded Holesky Testnet account',
                ],
                steps: [
                    'Go to Ethereum Holesky account',
                    'Click Unstake to claim button',
                    'Unstake modal opens correctly formatted',
                    'Check radio buttons',
                    'Change fee between Normal and Custom, confirm that Custom fee can be changed',
                    'Click Unstake button',
                    'Confirm on Trezor',
                    'Observe new Pending transaction',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
