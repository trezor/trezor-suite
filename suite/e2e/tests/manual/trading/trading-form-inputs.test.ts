import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading form inputs', { tag: ['@group=manual'] }, () => {
    test(
        'Buy form inputs validation',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies robustness of the Buy form inputs.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a wallet connected'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Bitcoin" (or any other coin)',
                    'Click on "Buy & Sell" tab',
                    'Verify "Trade history" button is present',
                    'Go back to "Buy"',
                    'Try entering values below minimum limits -> verify error message for crypto amount',
                    'Try entering values above maximum limits -> verify error message for crypto amount',
                    'Try entering values below minimum limits -> verify error message for fiat amount',
                    'Try entering values above maximum limits -> verify error message for fiat amount',
                    'Toggle Fiat/Crypto amount input -> verify conversion updates',
                    'Switch asset to buy -> verify form resets/updates',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Sell form inputs validation',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies robustness of the Sell form inputs.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a funded wallet'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Bitcoin" (or any other coin)',
                    'Click on "Buy & Sell" tab',
                    'Verify "Trade history" button is present',
                    'Go back to "Sell"',
                    'Try entering crypto values exceeding balance -> verify error message',
                    'Try entering fiat values exceeding balance -> verify error message',
                    'Use "Fraction buttons" with crypto values (25%, 50%, etc.) -> verify amount updates',
                    'Use "Fraction buttons" with fiat values (25%, 50%, etc.) -> verify amount updates',
                    'Toggle Fiat/Crypto amount input',
                    'Select different Fee levels -> verify total updates',
                ],
                category: TestCategory.Sell,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Exchange form inputs validation',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies robustness of the Exchange form inputs.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet',
                    'Coin availability for exchange',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Bitcoin" (or any other coin)',
                    'Click on "Swap" tab',
                    'Verify "Trade history" button is present',
                    'Go back to "Swap"',
                    'Fill out crypto amount',
                    'Select different "To" asset',
                    'Verify rate estimation updates',
                    'Try entering crypto values exceeding balance -> verify error message',
                    'Try entering fiat values exceeding balance -> verify error message',
                    'Use "Fraction buttons" with crypto values (25%, 50%, etc.) -> verify amount updates',
                    'Use "Fraction buttons" with fiat values (25%, 50%, etc.) -> verify amount updates',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
