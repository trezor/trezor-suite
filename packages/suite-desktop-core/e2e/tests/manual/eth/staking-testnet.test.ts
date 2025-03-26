import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Ethereum staking on testnet', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description: 'Verifies that a user can stake Ethereum on the Holesky testnet.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Holesky Testnet account',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to funded Ethereum Holesky account',
                        'Go to Staking tab and click "Start staking" button',
                        '“Staking in a nutshell” window appears, proceed to “I acknowledge and…” checkbox, Confirm',
                        '"Stake Ethereum" modal opens',
                        'confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                        'populate ETH and USD input field',
                        'confirm that "Clear all" button works correctly',
                        'change fee between "Normal" and "Custom", confirm that "Custom" fee can be changed',
                        'Click Continue button',
                        '"Confirm entry period" modal opens',
                        'Select “I acknowledge…” checkbox',
                        'Confirm & stake',
                        'Confirm that Trezor device got "Stake ETH on Everstake" message',
                        'touch Confirm button',
                        'Confirm that transaction appears in transaction history',
                        'Confirm "Total stake pending", "Stake" and "Rewards" values are correct',
                    ]),
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
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can unstake Ethereum on the Holesky testnet.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Holesky Testnet account',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
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
            ],
        },
        async () => {},
    );
});
