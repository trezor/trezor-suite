import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Solana staking', { tag: ['@group=manual'] }, () => {
    test(
        'Solana staking on mainnet',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake Solana on mainnet.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite app with a funded wallet connected',
                    'Funded Solana account',
                ],
                steps: [
                    'Navigate to funded Solana account',
                    'Go to Staking tab and click "Start staking" button',
                    '“Staking in a nutshell” window appears, proceed to “I acknowledge and…” checkbox, Confirm',
                    '"Stake Solana" modal opens',
                    'Confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                    'Populate SOL and USD input field',
                    'Click Continue button',
                    '"Confirm entry period" modal opens',
                    'Select “I acknowledge…” checkbox',
                    'Confirm & stake',
                    'Confirm that Trezor device got "Stake Solana on Everstake" message',
                    'Cancel the action or Finish the flow',
                ],
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Engagement, // Is it correct?
            }),
        },
        async () => {},
    );
});
