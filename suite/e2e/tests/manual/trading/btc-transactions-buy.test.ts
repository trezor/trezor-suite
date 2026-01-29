import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('BTC transactions buy', { tag: ['@group=manual'] }, () => {
    test(
        'Buy BTC',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can buy BTC using the Trade tab.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a wallet connected'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Bitcoin"',
                    'Select "Buy & Sell"',
                    'Select "Buy"',
                    'Fill out Fiat amount input',
                    'Fill out Crypto amount input',
                    'Use Fraction buttons',
                    'Select asset to buy (if different/needed)',
                    'Select Country / try to change country',
                    'Select Payment Method',
                    'Proceed with the buy flow (View offers)',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
