import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Sell BTC',
        {
            testCase: 'Verifies that a user can sell BTC in the mobile trading flow.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a funded BTC wallet'],
            steps: [
                'Open Trade tab and select Sell',
                'Select wallet/account in the header selector if needed',
                'Select asset to sell (if not default)',
                'Fill fiat amount input',
                'Fill crypto amount input',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select receive method (payment method)',
                'Select country',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and verify transition to next step',
                'On the next step verify fee level options are available',
            ],
            category: TestCategory.Sell,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
