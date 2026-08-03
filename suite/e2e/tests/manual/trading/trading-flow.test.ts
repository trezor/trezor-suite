import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading flow', { tag: ['@group=manual'] }, () => {
    test(
        'Buy BTC full flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a full live Buy flow from Trade through provider return and Trade history.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/buy-bitcoin.test.ts → "Buy Bitcoin from best offer" / "Buy Bitcoin from compared offer" (mocked provider); the live provider payment and return redirect are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a BTC receive account',
                    'Payment method available for the selected country (use non-US or USA + state)',
                ],
                steps: [
                    'Open Trade → "Buy"',
                    'Select asset to buy (Bitcoin) and Receive account',
                    'Set Country of residence (if USA, also select State of residence)',
                    'Enter a valid You pay amount; confirm best offer / You get updates',
                    'Click "Continue"',
                    'Confirm provider / payment preview; proceed to pay with the provider',
                    'Complete or cancel at the provider as required for the test run',
                    'Return to Suite; open Trade history',
                    'Confirm the buy appears with status and provider details (View details)',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Sell crypto full flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a full live Sell flow including fee selection, device signing and Trade history.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/sell-bitcoin.test.ts → "Sell Bitcoin for best offer", tests/trading/sell-ethereum.test.ts → "Sell Ethereum" and tests/trading/sell-inputs.test.ts (custom fee); the live provider payout is manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded sellable account',
                ],
                steps: [
                    'Open Trade → "Sell"',
                    'Select asset to sell and fill amount (use fraction buttons if helpful)',
                    'Set Country of residence; confirm You get / provider quote loads',
                    'Open Maximum fee; confirm Low, Normal, High and Customize fee',
                    'Select Customize fee; set a distinct custom rate; note the Maximum fee amount on Suite',
                    'Proceed with Sell; on the Trezor device confirm the fee matches the custom Maximum fee from Suite',
                    'Approve and send on the device',
                    'Complete provider payout steps as required',
                    'Open Trade history; confirm the sell appears with status and View details',
                ],
                category: TestCategory.Sell,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Swap CEX full flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a full live CEX Swap (e.g. BTC → ETH) through device confirm and Trade history.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-coins.test.ts → "Swap Solana to Bitcoin", tests/trading/swap-sol-to-btc.test.ts → "Swap SOL to BTC" and tests/trading/swap-fees-bitcoin.test.ts → "Swap custom fees for Bitcoin" (custom fee verified on device)',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with funded From account and receive network enabled',
                    'A CEX offer available',
                ],
                steps: [
                    'Open Trade → "Swap"',
                    'Select From and To assets (cross-chain CEX pair, e.g. Bitcoin → Ethereum)',
                    'Fill Swap amount; confirm Provider and You get',
                    'Open Provider and select a CEX offer if multiple are listed',
                    'Confirm Receive account; open Maximum fee and confirm Low, Normal, High and Customize fee',
                    'Select Customize fee; set a distinct custom rate; note the Maximum fee amount on Suite',
                    'Click "Swap"; on the Trezor device confirm the fee matches the custom Maximum fee from Suite',
                    'Send the transaction; wait for provider processing',
                    'Open Trade history; confirm the swap status and provider; open View details',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Cross-chain CEX swap between non-EVM networks',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies cross-chain CEX swaps where neither side is EVM (ADA → XRP and LTC → XLM), complementing the non-EVM → EVM pair in the CEX full flow.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST (partially): tests/trading/swap-sol-to-btc.test.ts → "Swap SOL to BTC" automates a non-EVM ↔ non-EVM CEX swap; the ADA → XRP and LTC → XLM pairs themselves are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with funded ADA and LTC accounts',
                    'Receive networks (XRP, XLM) enabled with a receive account available',
                    'A CEX offer available for both pairs',
                ],
                steps: [
                    'Open Trade → "Swap"; select From = Cardano (ADA), To = XRP (Ripple)',
                    'Fill Swap amount and use fraction buttons; confirm Provider and You get load',
                    'Open Provider and select a CEX offer',
                    'Confirm Receive account is the Suite XRP account; proceed through device confirm and send',
                    'Open Trade history; confirm the swap status and provider',
                    'Repeat the whole flow with From = Litecoin (LTC), To = XLM (Stellar)',
                    'Confirm both pairs produce offers and a signable transaction (no unsupported-pair or missing receive-account blocker)',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Swap DEX full flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a full live DEX Swap (e.g. LI.FI) including offer selection, device confirm and Trade history.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-dex-lifi.test.ts → "User can swap ETH to USDC via LI.FI DEX" (mocked, incl. device review and broadcast) and tests/trading/swap-fees-ethereum.test.ts → "Swap custom fees for Ethereum"',
                    'Seeded Trezor device with EVM clear-signing capable firmware when testing clear-signed swaps',
                    'Connected Trezor Suite with funded From asset (native or already-approved token)',
                    'A DEX offer available (e.g. LI.FI)',
                ],
                steps: [
                    'Open Trade → "Swap"',
                    'Select From and To (DEX-capable pair on the same network, e.g. ETH → USDC on Ethereum)',
                    'Fill amount; confirm Provider shows a DEX provider (e.g. LI.FI)',
                    'Open Provider offers if available; select a DEX offer',
                    'Confirm Receive account; open Maximum fee and confirm Low, Normal, High and Customize fee',
                    'Select Customize fee; set a distinct custom rate; note the Maximum fee amount on Suite',
                    'Click "Swap"; complete any required token approval first if prompted (also confirm approval fee on device if shown)',
                    'On the Trezor device confirm the swap fee matches the custom Maximum fee from Suite',
                    'Send; open Trade history and confirm status / View details',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Cross-chain DEX swap with token approval',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a cross-chain DEX Swap that requires token approval, then completes the swap to another network.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with an EVM token that needs approval (e.g. USDC on Ethereum) and a receive account on a non-EVM network (e.g. Bitcoin or Solana)',
                    'No sufficient existing allowance for the spender (fresh or revoked)',
                    'A cross-chain DEX offer to a non-EVM asset available',
                ],
                steps: [
                    'Open Trade → "Swap"',
                    'Select From = EVM token on one network (e.g. USDC on Ethereum)',
                    'Select To = asset on a non-EVM network (e.g. Bitcoin or Solana)',
                    'Fill Swap amount; confirm Provider is a DEX and Receive account is on the non-EVM destination network',
                    'Open Maximum fee; confirm Low, Normal, High and Customize fee',
                    'Select Customize fee; set a distinct custom rate; note the Maximum fee amount on Suite',
                    'When prompted, open Set & approve spending; choose exact (minimal) approval for the swap amount',
                    'Confirm approval on Suite and on the Trezor device; confirm the approval fee on device matches Suite if shown; wait until approval confirms',
                    'Click "Swap"; on the Trezor device confirm the swap fee matches the custom Maximum fee from Suite',
                    'Send; open Trade history and confirm the swap status / View details',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Cross-chain DEX swap between EVM networks',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a cross-chain DEX swap from Ethereum to another EVM network (e.g. ETH → BNB on BSC), including fee levels and the destination receive account.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded ETH account',
                    'Binance Smart Chain (or another destination EVM network) enabled with a receive account',
                    'A cross-chain DEX offer between the two EVM networks available',
                ],
                steps: [
                    'Open Trade → "Swap"',
                    'Select From = ETH (Ethereum); fill Swap amount and use fraction buttons',
                    'Select To = BNB (Binance Smart Chain) or a token on BSC',
                    'Confirm Provider shows a DEX offer and Receive account is on the destination EVM network',
                    'Open Provider; select a DEX offer',
                    'Open Maximum fee; confirm Low, Normal, High and Customize fee',
                    'Select Customize fee; set a distinct custom rate; note the Maximum fee amount on Suite',
                    'Click "Swap"; complete any required token approval first if prompted',
                    'On the Trezor device confirm the swap fee matches the custom Maximum fee from Suite',
                    'Send; open Trade history and confirm the swap status / View details',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Classic SPL token Swap from Solana',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a classic SPL (Token Program) Solana token can be selected as From and swapped in Suite Trade.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-token-to-coin.test.ts → "Swap Solana Tether token to Bitcoin" and tests/trading/swap-tokens.test.ts → "Swap Solana tokens" (classic SPL tokens)',
                    'Seeded Trezor device with Solana support (not T1B1)',
                    'Connected Trezor Suite with a funded Solana account holding a classic SPL token (e.g. USDC or USDT on Solana — Token Program, not Token-2022)',
                    'Enough SOL on the same account for fees',
                    'A Swap offer available for that token',
                ],
                steps: [
                    'Open the Solana account Tokens list; confirm the classic SPL token balance is visible',
                    'Open Trade → Swap',
                    'Open From asset picker; filter network to Solana',
                    'Confirm the classic SPL token appears under Your assets and can be selected',
                    'Select a To asset; fill a valid Swap amount so quotes load',
                    'Confirm Provider / You get updates and Swap becomes available',
                    'Confirm the Solana network fee is shown (custom fee levels are not available on Solana)',
                    'Click Swap; on the Trezor device confirm the fee matches Suite and that the Solana token transfer can be signed',
                    'Complete or abandon after device confirm as required; optionally confirm the swap in Trade history',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Token-2022 (SPL-2022) token Swap from Solana',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a Token-2022 (SPL-2022) Solana token can be selected as From and swapped in Suite Trade.',
                prerequisites: [
                    'Seeded Trezor device with Solana support (not T1B1)',
                    'Connected Trezor Suite with a funded Solana account holding a Token-2022 token (e.g. PYUSD — Token Extensions / TokenzQd… program, not classic Tokenkeg…)',
                    'Enough SOL on the same account for fees',
                    'A Swap offer available for that Token-2022 asset',
                ],
                steps: [
                    'Open the Solana account Tokens list; confirm the Token-2022 token balance is visible (verify mint uses Token-2022 if unsure, e.g. PYUSD)',
                    'Open Trade → Swap',
                    'Open From asset picker; filter network to Solana',
                    'Confirm the Token-2022 token appears under Your assets and can be selected (not missing / not blocked as unsupported)',
                    'Select a To asset; fill a valid Swap amount so quotes load',
                    'Confirm Provider / You get updates and Swap becomes available',
                    'Confirm the Solana network fee is shown (custom fee levels are not available on Solana)',
                    'Click Swap; on the Trezor device confirm the fee matches Suite and that the Token-2022 transfer can be signed',
                    'Complete or abandon after device confirm as required; optionally confirm the swap in Trade history',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Stellar token CEX Swap from XLM',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a Stellar (XLM) token can be selected as From and swapped via a CEX provider in Suite Trade.',
                prerequisites: [
                    'Seeded Trezor device with Stellar support',
                    'Connected Trezor Suite with a funded XLM account holding an activated Stellar token (e.g. USDC or USDT on Stellar) and enough XLM above reserve for fees',
                    'A CEX Swap offer available for that Stellar token',
                ],
                steps: [
                    'Open the Stellar account Tokens list; confirm the Stellar token balance is visible and activated',
                    'Open Trade → Swap',
                    'Open From asset picker; filter network to Stellar',
                    'Confirm the Stellar token appears under Your assets and can be selected',
                    'Select a To asset (e.g. Bitcoin or another CEX-supported asset)',
                    'Fill a valid Swap amount so quotes load',
                    'Open Provider and select a CEX offer (not a DEX)',
                    'Confirm Provider / You get updates and Swap becomes available',
                    'Open Maximum fee; select Customize fee with a distinct rate; note the fee on Suite',
                    'Click Swap; on the Trezor device confirm the fee matches Suite and that the Stellar token payment can be signed',
                    'Complete or abandon after device confirm as required; optionally confirm the swap in Trade history',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Tron token CEX Swap from TRC20',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies a Tron (TRC20) token can be selected as From and swapped via a CEX provider in Suite Trade.',
                prerequisites: [
                    'Seeded Trezor device with Tron support (not T1B1)',
                    'Connected Trezor Suite with a funded TRX account holding a TRC20 token (e.g. USDT on Tron) and enough TRX for fees / energy',
                    'A CEX Swap offer available for that Tron token',
                ],
                steps: [
                    'Open the Tron account Tokens list; confirm the TRC20 token balance is visible',
                    'Open Trade → Swap',
                    'Open From asset picker; filter network to Tron',
                    'Confirm the TRC20 token appears under Your assets and can be selected',
                    'Select a To asset (e.g. Bitcoin or another CEX-supported asset)',
                    'Fill a valid Swap amount so quotes load',
                    'Open Provider and select a CEX offer (not a DEX)',
                    'Confirm Provider / You get updates and Swap becomes available',
                    'Open Maximum fee; select Customize fee with a distinct rate; note the fee on Suite',
                    'Click Swap; on the Trezor device confirm the fee matches Suite and that the TRC20 transfer can be signed',
                    'Complete or abandon after device confirm as required; optionally confirm the swap in Trade history',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
