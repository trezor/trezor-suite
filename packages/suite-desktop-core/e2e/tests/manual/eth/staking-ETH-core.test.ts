import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Ethereum staking core FW', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking core FW',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can stake Ethereum. Holesky testnet can be used as backup',
                prerequisites: [
                    'Seeded Trezor device with transactions with "academic" seed',
                    'Connected Trezor Suite',
                    'Funded Ethereum account',
                ],
                steps: [
                    'Navigate to funded Ethereum account',
                    'Go to Staking tab and click "Start staking" buton',
                    'Staking in a nutshell window appears” proceed to “I acknowledge and…” checkbox, Confirm',
                    'Stake Ethereum" modal opens',
                    'Confirm that all 4 buttons are clickable and work correctly: "10%", "20%", "50%", "Max"',
                    'Populate ETH and USD input field',
                    'Change fee between Normal, Low, High" and "Custom", confirm that "Custom" fee can be changed',
                    'Click Continue button',
                    'Confirm entry period" modal ”pens',
                    'Select “I acknowledge…” checkbox',
                    'Confirm & stake',
                    'Confirm that Trezor device and Trezor Suite got "Stake ETH on Everstake" message',
                    'Touch Confirm button',
                    'Confirm that transaction appears in transaction history',
                    'Confirm that instant badge if present for the transaction if the transaction was processed instantly',
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
        'Ethereum unstaking core FW',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can unstake Ethereum. Holesky testnet can be used as backup',
                prerequisites: [
                    'Seeded Trezor device with transactions with "academic" seed',
                    'Connected Trezor Suite',
                    'Funded Testnet account',
                ],
                steps: [
                    'Go to Ethereum account',
                    'Click Unstake to claim button',
                    'Unstake modal opens correctly formatted',
                    'Change fee between Normal, Low, High and Custom, confirm that Custom fee can be changed',
                    'Click Unstake button',
                    'Confirm on Trezor',
                    'Observe new Pending transaction',
                    'Confirm that instant badge if present for the transaction if the transaction was processed instantly',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
    test(
        'Ethereum claiming core FW',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can claim Ethereum rewards. Holesky testnet can be used as backup',
                prerequisites: [
                    'Seeded Trezor device with transactions with "academic" seed',
                    'Connected Trezor Suite',
                    'Funded Ethereum account with claimable rewards',
                ],
                steps: [
                    'Navigate to Ethereum account with claimable rewards',
                    'Go to Staking tab and locate "Claim rewards" button',
                    'Click "Claim" button',
                    'Claim rewards modal opens',
                    'Change fee between Normal, Low, High" and "Custom", confirm that "Custom" fee can be changed',
                    'Click Continue button',
                    'Confirm on Trezor device',
                    'Observe new transaction in transaction history',
                    'Confirm that claimed rewards are reflected in account balance',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Medium,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
