import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading Buy Sell Swap forms', { tag: ['@group=manual'] }, () => {
    test(
        'Buy form inputs and USA state of residence',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the Buy form on Trade: amounts, receive account, country, USA state requirement and network filter in the asset picker.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a wallet (BTC account available)',
                ],
                steps: [
                    'Click on "Swap" and go to the Buy form',
                    'Confirm "Trade history" is available from the Trade header',
                    'Confirm the form shows "You buy", "You pay", "Receive account", "Country of residence" and "Continue"',
                    'Confirm fraction buttons (10%, 25%, 50%, Max) are not shown on Buy',
                    'Toggle "Enter amount in BTC" / fiat via the crypto-fiat switch; confirm You pay updates',
                    'Open "You buy" asset picker; confirm search placeholder "Search coin or token"',
                    'Confirm network filter shows "All networks"; select a network and confirm Your assets / All assets lists filter',
                    'Close the picker; confirm Receive account shows a Suite account',
                    'Set Country of residence to "USA"',
                    'Confirm "State of residence" appears and shows "Not selected"',
                    'Confirm the offer panel shows "To see available offers, select your state of residence." and Continue stays blocked',
                    'Select State of residence "California" (or another US state)',
                    'Enter a valid fiat amount; confirm quotes can load and Continue becomes available',
                    'Change State of residence to a different state; confirm offers / payment options update',
                    'Change the fiat currency in "You pay"; confirm the amount and the offers update to the new currency',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Sell form inputs validation',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the Sell form on Trade: fraction buttons, fiat/crypto toggle, balance errors and country.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/sell-inputs.test.ts → "Sell form % inputs and limits" (fraction buttons, decimals / not-enough-funds errors, fiat currency switch)',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded account (e.g. BTC or ETH)',
                ],
                steps: [
                    'Open Trade and select the "Sell" tab',
                    'Confirm the form shows "You sell", "You pay", "Country of residence" and "Sell"',
                    'Confirm fraction buttons "10%", "25%", "50%" and "Max" are visible',
                    'Use each fraction button; confirm crypto amount updates from balance',
                    'Toggle fiat/crypto amount input; confirm conversion updates both ways',
                    'Enter a crypto amount above balance; confirm an insufficient-balance error',
                    'Enter a fiat amount that exceeds balance; confirm an error is shown',
                    'Change Country of residence; confirm the form remains usable and offers refresh when amount is valid',
                    'Change the fiat currency in "You get"; confirm the amount and the offers update to the new currency',
                ],
                category: TestCategory.Sell,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Swap form inputs and network filter',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the Swap form on Trade: From/To pickers, fractions, balance errors, rate update and All networks filter.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-inputs.test.ts → "Swap form inputs validation" (From/To pickers with network filter, amount, provider and You get); the "All networks" default state and fiat-mode fractions are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded wallet',
                ],
                steps: [
                    'Open Trade and select the "Swap" tab',
                    'Confirm the form shows "From", "Swap amount", "To" and "Swap"',
                    'Confirm fraction buttons "10%", "25%", "50%" and "Max" are visible',
                    'Open the From asset picker; confirm "Search coin or token" and "All networks" filter',
                    'Filter by a network; confirm the asset list updates (Your assets / All assets)',
                    'Select From and To assets; fill Swap amount',
                    'Confirm Provider and "You get" update after quotes load',
                    'Enter an amount exceeding balance; confirm an error is shown',
                    'Use fraction buttons in crypto and after toggling to fiat; confirm amounts update',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
