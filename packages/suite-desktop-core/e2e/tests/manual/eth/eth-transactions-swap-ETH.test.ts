import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
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
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Click swap button',
                    'Select token to swap from and to',
                    'Fill out amount field',
                    'Click "swap" button',
                    'Confirm address on Device',
                    '"confirm on Trezor & Send transaction" via Suite and device button',
                    'Make sure it is mined',
                    'Check transaction history for the swap transaction',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
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
                    'navigate to the "Accounts"',
                    'Select or enable and then Select "Ethereum"',
                    'Select random user account',
                    'Click swap button',
                    'Select Ethereum as the token to swap from and random token to swap to',
                    'Fill out amount field',
                    'Click "swap" button',
                    'Confirm address on Device',
                    '"confirm on Trezor & Send transaction" via Suite and device button',
                    'Make sure it is mined',
                    'Check transaction history for the swap transaction',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
