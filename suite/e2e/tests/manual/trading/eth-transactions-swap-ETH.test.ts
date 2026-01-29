import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Token swap

test.describe.skip('Eth transactions swap', { tag: ['@group=manual'] }, () => {
    test(
        'Perform token swap',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can perform an token swap in the Suite.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random account',
                    'Click on "Swap" tab',
                    'Select token to swap from and to',
                    'Fill out amount field both in token amount and in fiat amount',
                    'Click "swap" button',
                    'Confirm address on Device',
                    '"Confirm on Trezor & Send transaction" via Suite and device button',
                    'Make sure it is confirmed',
                    'Check transaction history for the swap transaction',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Perform Ethereum-only swap',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can perform an Ethereum-only swap in the Suite.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded wallet connected',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random account',
                    'Click on "Swap" tab',
                    'Select Ethereum as the token to swap from and random token to swap to',
                    'Fill out amount field both in ETH amount and in fiat amount',
                    'Click "swap" button',
                    'Confirm address on Device',
                    '"confirm on Trezor & Send transaction" via Suite and device button',
                    'Make sure it is confirmed',
                    'Check transaction history for the swap transaction',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
