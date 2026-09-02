import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading clear signing', { tag: ['@group=manual'] }, () => {
    test(
        'SLIP24 clear signing on Sell or Swap',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies SLIP24 payment-request clear signing for a supported Sell or Swap trade on capable firmware.',
                prerequisites: [
                    'Trezor model with SLIP24 support (not T1B1); firmware ≥ 2.12.1',
                    'SLIP24 / trading.slip24 feature and experimental slip24 enabled as required by current Suite',
                    'Connected Trezor Suite',
                    'Funded account on a SLIP24-supported network (bitcoin, ethereum, solana, stellar or ripple)',
                ],
                steps: [
                    'Open Trade → Sell or Swap for a SLIP24-supported asset pair',
                    'Fill a valid amount and select an offer so the trade can proceed to device confirmation',
                    'Continue to send / confirm on Trezor',
                    'On the device, confirm clear-signed payment-request screens',
                    'On Suite, confirm the review summary matches SLIP24 behaviour (fee-focused summary when SLIP24 is active)',
                    'Approve or reject on the device; confirm Suite follows the device outcome',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'ERC7730 clear signing on EVM DEX Swap',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies ERC7730 / EVM clear signing for a DEX Swap on a device with evmClearSigning, versus generic contract review without it.',
                prerequisites: [
                    'ALSO COVERED BY AUTO TEST: tests/trading/swap-dex-lifi.test.ts → "User can swap ETH to USDC via LI.FI DEX" asserts the clear-signed device screens (recipient_name, swap_intent, send / receive amounts and receive address); the fallback to generic contract review without evmClearSigning is manual-only',
                    'Trezor with evmClearSigning capability (not T1B1); firmware supporting the DEX contract registry batch in use',
                    'Connected Trezor Suite',
                    'Funded EVM account for a clear-signed DEX provider (e.g. LI.FI)',
                ],
                steps: [
                    'Open Trade → Swap; select an EVM DEX pair that uses a clear-signed provider (e.g. LI.FI)',
                    'Fill amount; select the DEX offer; complete token approval first if required',
                    'Click Swap and open device review',
                    'Confirm the device shows clear-signed EVM swap details',
                    'Confirm Suite review matches clear-signed trading swap behaviour',
                    'Optionally repeat on firmware/device without evmClearSigning and confirm fallback to generic contract data review',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Critical,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
