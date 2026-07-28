import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account send', { tag: ['@group=manual'] }, () => {
    test(
        'Basic send flow - token picker, amounts, fees, simulation',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the core send flow: token picker, crypto/fiat amounts, send max, and fee selection.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded EVM account holding tokens',
                ],
                steps: [
                    'Navigate to the funded account and open the "Send" form',
                    'Open the token picker and confirm the native coin and all held tokens are listed with balances',
                    'Select a token, then switch back to the native coin',
                    'Fill in a valid recipient address',
                    'Fill in the crypto amount and confirm the fiat value is calculated',
                    'Edit the fiat amount and confirm the crypto value is recalculated (Crypto ↔ Fiat both ways)',
                    'Click "Send max" and confirm the amount is set to the maximum minus fee',
                    'Switch the fee between Normal, Low, High and Custom; confirm Custom fee can be edited and validated',
                    'Confirm the device prompt modal shows expected balance changes before signing',
                    'Sign the transaction and confirm the data on the Trezor device matches the form',
                    'Confirm the sent transaction appears as pending in the history',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Recipient address validation',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies all recipient address validations: format, contract addresses, ATA check, reserves, checksum, deprecated addresses and Taproot firmware check.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with BTC, EVM, Tron, Solana and XRP/XLM accounts funded',
                ],
                steps: [
                    'Open the Send form and enter an invalid address; confirm a validation error is shown',
                    'Enter an address of a different network and confirm it is rejected',
                    'On an EVM account, enter a known contract address and confirm a warning about sending to a contract is shown',
                    'On a Tron account, enter a contract address and confirm the same contract warning is shown',
                    'On a Solana token send, enter an address and confirm the associated token account (ATA) check runs and communicates the result',
                    'On an XRP/XLM account, send to a new (unfunded) address and confirm the network reserve requirement is communicated',
                    'On an EVM account, enter a valid address with wrong checksum casing and confirm Suite warns and offers checksum autocorrect',
                    'Enter a deprecated address format (e.g. LTC legacy 3-address) and confirm the deprecation warning is shown',
                    'Send to a Taproot (bc1p) address with old firmware and confirm the firmware update requirement is communicated',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Multiple recipients, QR scan and import recipients',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies sending to multiple recipients, scanning a QR code and importing recipients from a file.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded BTC account',
                    'CSV file with recipients for the import',
                ],
                steps: [
                    'Open the Send form on the BTC account',
                    'Click "Add recipient" and confirm a second recipient form is added',
                    'Fill both recipients and confirm the total amount and fee reflect all outputs',
                    'Remove a recipient and confirm the totals update',
                    'Use the QR scan button and scan an address QR code',
                    'Confirm the address (and amount, if encoded) is filled into the form',
                    'Use "Import recipients" and load the CSV file',
                    'Confirm all recipients from the file are added with correct addresses and amounts',
                    'Sign the multi-recipient transaction and confirm all outputs on the device',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Coin-specific send behavior - Solana timer, memo tags, Cardano minimum, Tron activation',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies coin-specific send behaviors: Solana blockhash timer, memo/destination tags and coin-specific warnings.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with funded SOL, XRP (or XLM), ADA and TRX accounts',
                ],
                steps: [
                    'On the Solana account, review a transaction and confirm the countdown timer (blockhash validity) is displayed',
                    'Let the timer expire and confirm the transaction must be refreshed/rebuilt',
                    'On the XRP/XLM account, fill in a memo/destination tag and confirm it is included in the review and on the device',
                    'On the Cardano account, enter an amount below the minimum (min ADA) and confirm the minimum amount info is shown',
                    'On the Tron account, send to a fresh (not yet activated) address and confirm the new account activation fee warning is shown',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Advanced send features - raw, broadcast, locktime, OP_RETURN, ETH data',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the advanced send features: send raw transaction, broadcast toggle, locktime, OP_RETURN and ETH data.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded BTC and ETH accounts',
                ],
                steps: [
                    'On the BTC Send form, disable the "Broadcast" toggle, sign a transaction and confirm the raw signed transaction is returned instead of broadcast',
                    'Use the "Send raw" feature to broadcast the previously signed raw transaction and confirm it appears in history',
                    'Set a locktime (blockheight or timestamp) and confirm it is shown in the review and on the device',
                    'Add an OP_RETURN output with custom data and confirm it on the device and in the transaction detail',
                    'On the ETH Send form, add hex data to the transaction and confirm the data is shown in the review and on the device',
                    'On the ETH Send form, set a custom nonce and confirm the chosen nonce is used in the review and on the device',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Low,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
