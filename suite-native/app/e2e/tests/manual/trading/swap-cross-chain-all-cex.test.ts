import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Swap BTC -> ETH (Non-EVM <-> EVM)',
        {
            testCase: 'Verifies cross-chain CEX swap from Bitcoin to Ethereum in mobile app.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a funded BTC wallet'],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select to asset as ETH (Ethereum)',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Select a CEX offer',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and verify transition to next step',
                'On the next step verify fee level options are available',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );

    it(
        'Swap LTC -> XLM (Non-EVM <-> Non-EVM)',
        {
            testCase: 'Verifies cross-chain CEX swap from Litecoin to XLM in mobile app.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a funded LTC wallet'],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select to asset as XLM (Stellar)',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Select a CEX offer',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and verify transition to next step',
                'On the next step verify fee level options are available',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.Medium,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
