import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('BTC transactions sell', { tag: ['@group=manual'] }, () => {
    test(
        'Sell BTC',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can sell BTC using the Trade tab.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a funded BTC wallet'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Bitcoin"',
                    'Select "Buy & Sell"',
                    'Select "Sell"',
                    'Select asset to sell (if not default)',
                    'Fill out Fiat amount input',
                    'Fill out Crypto amount input',
                    'Use Fraction buttons',
                    'Select Fee level',
                    'Select Receive Method (Payment method)',
                    'Select Country',
                    'Proceed with the sell flow (View offers)',
                ],
                category: TestCategory.Sell,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
