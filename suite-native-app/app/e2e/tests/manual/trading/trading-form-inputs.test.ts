import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Buy form inputs validation',
        {
            testCase: 'Verifies robustness of Buy form inputs in mobile app.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a wallet connected'],
            steps: [
                'Open Trade tab and select Buy',
                'Select wallet/account in the header selector if needed',
                'Verify Trade history action is present',
                'Verify Continue is disabled before valid required inputs are provided',
                'Try entering values below minimum limits and verify amount error',
                'Try entering values above maximum limits and verify amount error',
                'Switch currency and verify form updates correctly',
                'Switch asset to buy and verify form updates correctly',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify provider terms link at the bottom matches selected provider',
                'Select receive account and verify validation when no account is selected',
                'Verify Continue is enabled only when all required fields are valid',
            ],
            category: TestCategory.Buy,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );

    it(
        'Sell form inputs validation',
        {
            testCase: 'Verifies robustness of Sell form inputs in mobile app.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a funded wallet'],
            steps: [
                'Open Trade tab and select Sell',
                'Select wallet/account in the header selector if needed',
                'Verify Trade history action is present',
                'Verify Continue is disabled before valid required inputs are provided',
                'Try entering crypto values exceeding balance and verify error message',
                'Try entering fiat values exceeding balance and verify error message',
                'Use both fiat and crypto amount inputs',
                'Switch currency and verify form updates correctly',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify provider terms link at the bottom matches selected provider',
                'Verify Continue is enabled only when all required fields are valid',
                'Tap Continue and on next step select different fee levels and verify total updates',
            ],
            category: TestCategory.Sell,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );

    it(
        'Swap form inputs validation',
        {
            testCase: 'Verifies robustness of Swap form inputs in mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a funded wallet',
                'Coin availability for swap',
            ],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Verify Trade history action is present',
                'Verify Continue is disabled before valid required inputs are provided',
                'Fill out crypto amount',
                'Select a different to asset',
                'Verify rate estimation updates',
                'Try entering crypto values exceeding balance and verify error message',
                'Try entering fiat values exceeding balance and verify error message',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify provider terms link at the bottom matches selected provider',
                'Verify Continue is enabled only when all required fields are valid',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
