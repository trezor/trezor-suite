import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Swap ETH (Ethereum) -> BNB (BSC)',
        {
            testCase: 'Verifies cross-chain DEX swap between Ethereum and BSC in mobile app.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a funded ETH wallet'],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Fill crypto amount and fiat amount and use fraction buttons',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select to asset as BNB (BSC) or token on BSC',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Select a DEX offer',
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
