import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Ethereum staking on testnet', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can stake Ethereum on the Holesky testnet.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Holesky Testnet account',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Navigate to funded Ethereum Holesky account',
                        'Go to Staking tab and click "Start staking" button',
                        '“Staking in a nutshell” window appears, proceed to “I acknowledge and…” checkbox, Confirm',
                        '"Stake Ethereum" modal opens',
                        'Confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                        'Populate ETH and USD input field',
                        'Confirm that "Clear all" button works correctly',
                        'Change fee between "Normal" and "Custom", confirm that "Custom" fee can be changed',
                        'Click Continue button',
                        '"Confirm entry period" modal opens',
                        'Select “I acknowledge…” checkbox',
                        'Confirm & stake',
                        'Confirm that Trezor device got "Stake ETH on Everstake" message',
                        'Touch Confirm button',
                        'Confirm that transaction appears in transaction history',
                        'Confirm "Total stake pending", "Stake" and "Rewards" values are correct',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.ETH,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Trends,
                },
            ],
        },
        async () => {},
    );

    test(
        'Ethereum unstaking',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that a user can unstake Ethereum on the Holesky testnet.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Holesky Testnet account',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Go to Ethereum Holesky account',
                        'Click Unstake to claim button',
                        'Unstake modal opens correctly formatted',
                        'Check radio buttons',
                        'Change fee between Normal and Custom, confirm that Custom fee can be changed',
                        'Click Unstake button',
                        'Confirm on Trezor',
                        'Observe new Pending transaction',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.ETH,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Trends,
                },
            ],
        },
        async () => {},
    );
});
