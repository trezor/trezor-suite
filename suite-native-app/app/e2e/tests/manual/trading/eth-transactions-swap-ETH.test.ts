import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Perform token swap',
        {
            testCase: 'Verifies that a user can perform a token swap in the mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a funded Ethereum wallet',
            ],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Select token to swap from and token to swap to',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and proceed to confirmation',
                'Confirm on Trezor and send transaction',
                'Verify transaction is confirmed',
                'Check transaction history for swap transaction',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );

    it(
        'Perform Ethereum-only swap',
        {
            testCase: 'Verifies that a user can perform an Ethereum-only swap in the mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a funded Ethereum wallet',
            ],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Select Ethereum as from asset and random token as to asset',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and proceed to confirmation',
                'Confirm on Trezor and send transaction',
                'Verify transaction is confirmed',
                'Check transaction history for swap transaction',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
