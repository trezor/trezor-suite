import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Cross-chain EVM DEX Swap', { tag: ['@group=manual'] }, () => {
    test(
        'Swap ETH (Ethereum) -> BNB (BSC)',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies cross-chain DEX swap between Ethereum and BSC.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a funded ETH wallet'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Ethereum"',
                    'Click on "Swap" tab',
                    'Fill out crypto amount and fiat amount and use fraction buttons',
                    'Select "To" asset: BNB (Binance Smart Chain) or a token on BSC',
                    'Check different fee levels and custom fee',
                    'Click on "Provider" button',
                    'Select a DEX offer',
                    'Proceed with the swap flow',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
