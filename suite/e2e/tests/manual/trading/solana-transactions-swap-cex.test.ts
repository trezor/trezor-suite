import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Solana transactions swap CEX', { tag: ['@group=manual'] }, () => {
    test(
        'Swap SOL via CEX',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can swap SOL via CEX.',
                prerequisites: ['Seeded Trezor device', 'Trezor Suite with a funded Solana wallet'],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Solana"',
                    'Click on "Swap" tab',
                    'Select "From" asset (SOL)',
                    'Select "To" asset (token)',
                    'Fill out SOL amount and fiat amount and use fraction buttons',
                    'Proceed with the swap flow',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Swap SPL Token via CEX',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can swap SPL Token via CEX.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a funded Solana wallet containing SPL tokens',
                ],
                steps: [
                    'Navigate to the "Accounts"',
                    'Select "Solana"',
                    'Click on "Swap" tab',
                    'Select "From" asset (SPL Token)',
                    'Select "To" asset (target coin)',
                    'Fill out crypto amount and fiat amount and use fraction buttons',
                    'Proceed with the swap flow',
                ],
                category: TestCategory.Swap,
                priority: TestPriority.High,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
