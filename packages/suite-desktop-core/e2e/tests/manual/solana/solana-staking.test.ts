import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Solana staking', { tag: ['@group=manual'] }, () => {
    test(
        'Solana staking on mainnet',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can stake Solana on mainnet.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Trezor Suite app with a funded wallet connected',
                        'Funded Solana account'
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to funded Solana account',
                        'Go to Staking tab and click "Start staking" button',
                        '“Staking in a nutshell” window appears, proceed to “I acknowledge and…” checkbox, Confirm',
                        '"Stake Solana" modal opens',
                        'confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                        'populate SOL and USD input field',
                        'confirm that "Clear all" button works correctly',
                        'change fee between "Normal" and "Custom", confirm that "Custom" fee can be changed',
                        'Click Continue button',
                        '"Confirm entry period" modal opens',
                        'Select “I acknowledge…” checkbox',
                        'Confirm & stake',
                        'Confirm that Trezor device got "Stake Solana on Everstake" message',
                        'cancel the action',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
