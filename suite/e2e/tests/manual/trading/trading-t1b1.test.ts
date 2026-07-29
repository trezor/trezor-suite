import { DeviceModel, TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading T1B1', { tag: ['@group=manual'] }, () => {
    test(
        'T1B1 Swap smoke on supported coins',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Trade Swap works on Trezor One (T1B1) for supported coins and that unsupported networks and clear-signing features are blocked.',
                prerequisites: [
                    'Trezor One (T1B1) seeded and connected',
                    'Connected Trezor Suite',
                    'Funded BTC account (and ETH if enabled on this firmware)',
                ],
                steps: [
                    'Connect T1B1; open Trade → Swap',
                    'Select a T1B1-supported pair (e.g. BTC-related CEX); confirm quotes and device confirm path work',
                    'Confirm Tron and Solana trading/send are unavailable or networks cannot be used on T1B1',
                    'Confirm SLIP24 clear signing is not offered / not supported on T1B1',
                    'Confirm ERC7730 / EVM clear-signing DEX review is not available on T1B1 (generic or blocked as designed)',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
                deviceModel: DeviceModel.T1B1,
            }),
        },
        async () => {},
    );
});
