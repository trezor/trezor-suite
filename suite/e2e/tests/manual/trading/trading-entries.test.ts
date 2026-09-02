import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading entries', { tag: ['@group=manual'] }, () => {
    test(
        'Sidebar and Trade tabs',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Trade opens from the sidebar and that Swap / Buy / Sell / Concierge / Trade history tabs work.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST (partially): tests/trading/navigation.test.ts → "Navigate to" covers the sidebar Swap entry; Concierge and Trade history tabs are manual-only',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a wallet',
                ],
                steps: [
                    'From the sidebar, click "Swap"; confirm Trade opens on the Swap tab',
                    'Switch to Buy, Sell and Concierge; confirm each form loads',
                    'Open Trade history from the Trade header; confirm history view',
                    'Return to Swap / Buy / Sell and confirm the form is usable again',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Dashboard and empty wallet / account Buy',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Trade Buy can be opened from the Dashboard and from empty wallet / empty account Buy CTAs.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/navigation.test.ts → "Navigate to" (Buy from dashboard asset card, Buy from empty account) and tests/dashboard/assets.test.ts → "User can initiate buy from Assets in table view" / "in grid view"',
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'A wallet or account in an empty / zero-balance state that shows a Buy CTA (or use a fresh account)',
                ],
                steps: [
                    'Open an empty account / wallet, verify that the Buy CTA is shown, and click it',
                    'Confirm Trade Buy opens with that account / network context',
                    'From Dashboard account header actions (Buy), confirm Trade Buy opens for the selected account context when available',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Account header Buy and Sell',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies account page header Buy and Sell open Trade with the correct account prefilled.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/navigation.test.ts → "Navigate to" (Buy / Sell / Swap from account trade section)',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with at least one funded account (e.g. BTC or ETH)',
                ],
                steps: [
                    'Open a funded account (e.g. Bitcoin #1 or Ethereum #1)',
                    'In the account page header, click Buy',
                    'Confirm Trade opens on Buy with that account as Receive account / asset context',
                    'Return to the same account; click Sell in the header',
                    'Confirm Trade opens on Sell with that account / asset as You sell',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Tokens tab Buy Sell Swap',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Buy, Sell and Swap actions from the account Tokens tab open Trade with the token prefilled.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/navigation.test.ts → "Navigate to" (Buy from token, Sell from token, Swap from token)',
                    'Seeded Trezor device',
                    'Connected Trezor Suite with an EVM (or other) account holding tokens (e.g. ETH + USDT / USDC)',
                ],
                steps: [
                    'Open the account Tokens tab (e.g. Ethereum #1 → Tokens)',
                    'On a held token row, use Buy; confirm Trade Buy opens with that token as You buy',
                    'Return to Tokens; use Sell on the token; confirm Trade Sell opens with that token as You sell',
                    'Return to Tokens; use Swap on the token; confirm Trade Swap opens with that token as From',
                    'Confirm network / contract context matches the token (e.g. USDT on Ethereum vs Base)',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Earn tab Buy',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Buy CTAs on the Earn page open Trade Buy with the expected asset prefill.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with Earn available (staking / yield rows that expose Buy)',
                ],
                steps: [
                    'Open Earn from the sidebar',
                    'Locate a staking or yield opportunity that shows a Buy action',
                    'Click Buy; confirm Trade opens on the Buy tab',
                    'Confirm You buy / asset context matches the Earn opportunity asset when Suite prefills it',
                    'Repeat for another Earn row type if both staking and yield Buy CTAs are present',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Trading keyboard shortcuts',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies the ALT+X / ALT+B / ALT+C keyboard shortcuts open the matching Trade Swap / Buy / Sell tabs (both desktop and web).',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with a device selected (shortcuts require a selected device)',
                ],
                steps: [
                    'Focus the Suite window with no text input focused',
                    'Press ALT + X; confirm Trade opens on Swap',
                    'Press ALT + B; confirm Trade opens on Buy',
                    'Press ALT + C; confirm Trade opens on Sell',
                    'Repeat on the other platform (desktop and web) as the shortcuts are not desktop-only',
                    'Disconnect / forget the device so no device is selected; confirm the shortcuts no longer navigate to Trade',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.Low,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
