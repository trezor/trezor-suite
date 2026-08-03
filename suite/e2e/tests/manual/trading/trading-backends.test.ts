import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading backends', { tag: ['@group=manual'] }, () => {
    test(
        'Swap quotes, offer filters and offer selection',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies live Trezor Trade API quote loading on Swap, the All / CEX / DEX / KYC offer filters and that selecting another offer updates the form.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST (partially): tests/trading/swap-inputs.test.ts → "Swap form inputs validation" covers quote loading and switching to a different offer; the All / CEX / DEX / KYC filters are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded account for the From asset',
                ],
                steps: [
                    'Open Trade → Swap; select From / To assets and fill a valid Swap amount',
                    'Wait until the offers finish loading; confirm "Provider" shows a provider name and "You get" shows a non-zero amount',
                    'Open the selected Provider row to open the offers modal',
                    'Confirm the offer list shows provider name and rate per offer',
                    'If offer filters are shown (All / CEX / DEX / KYC), exercise each filter and confirm the offer list updates',
                    'Select a different offer; confirm the modal closes and the selected Provider on the form reflects the choice',
                    'Lower the amount below provider minimums; confirm empty / blocked quote messaging',
                    'Restore a valid amount; confirm offers load again',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Buy quotes, blocked states and provider redirect',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies live Buy quote loading, below/above limit and empty quote states, offer selection and the return redirect from the provider (USA state requirement is covered by the Buy form test).',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/buy-negative.test.ts → "Buy form handles input limits and empty quotes" (min / max / empty quotes, mocked) and tests/trading/buy-bitcoin.test.ts → "Buy Bitcoin from compared offer" (offer selection); the live provider redirect back to Suite is manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a wallet',
                ],
                steps: [
                    'Open Trade → Buy; set Country of residence and enter a valid You pay amount',
                    'Wait until the offers finish loading; confirm the best offer shows a provider name and "You get" shows a non-zero amount',
                    'Lower the amount below provider minimums; confirm the limit error and that no offers are shown',
                    'Raise the amount above provider maximums; confirm the limit error',
                    'Restore a valid amount; open the Provider row and select a different offer',
                    'Confirm the modal closes and the selected Provider / payment method on the form reflects the choice',
                    'Click "Continue" and proceed to the provider',
                    'Return to Suite via the provider redirect; confirm Suite shows the trade as submitted',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Sell quotes, offer selection and provider redirect',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies live Sell quote loading, offer selection and the return redirect from the provider.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/sell-inputs.test.ts → "Sell form % inputs and limits" (limit errors) and tests/trading/sell-solana.test.ts → "Sell Solana for compared offer" (offer selection); the live provider payout and redirect back to Suite are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a funded sellable account',
                ],
                steps: [
                    'Open Trade → Sell; set Country of residence and fill a valid amount',
                    'Wait until the offers finish loading; confirm "You get" shows a non-zero amount',
                    'Lower the amount below provider minimums; confirm the limit error and that no offers are shown',
                    'Restore a valid amount; open the Provider row and select a different offer',
                    'Confirm the modal closes and the selected Provider / receive method on the form reflects the choice',
                    'Continue to the provider and complete the required payout steps',
                    'Return to Suite via the provider redirect; confirm Suite shows the trade as submitted',
                ],
                category: TestCategory.Sell,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Trade history list and details',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Trade history empty and populated states, buy/sell/swap counters, row details and View details (live; complements automated swap-history).',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-history.test.ts → "View swap order history details" and "Ongoing swap detail shows the processing header"; the empty state, buy/sell rows and the buy/sell/swap counters are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Prefer a wallet with at least one past buy, sell or swap; also check empty history if possible on a fresh wallet',
                ],
                steps: [
                    'Open Trade → Trade history from the Trade header',
                    'If there are no trades, confirm the empty state shows "No transactions"',
                    'With existing trades, confirm the counter text (e.g. "N buys • N sells • N swaps") matches the listed rows',
                    'Confirm each visible row shows type (buy/sell/swap), amounts, date, status (e.g. Approved / Pending / Error) and provider',
                    'Confirm Trade ID is shown and can be copied',
                    'Click View details on a swap (and buy/sell if present); confirm detail sidebar/panel shows matching status, amounts, provider and ids',
                    'Close details and open another row; confirm details update',
                    'After completing a new trade in another manual run, return here and confirm the new row appears at the top with the expected status',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
