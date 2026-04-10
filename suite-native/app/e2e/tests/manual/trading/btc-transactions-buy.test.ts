import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Buy BTC',
        {
            testCase: 'Verifies that a user can buy BTC in the mobile trading flow.',
            prerequisites: ['Seeded Trezor device', 'Trezor Suite Lite with a wallet connected'],
            steps: [
                'Open Trade tab and select Buy',
                'Select wallet/account in the header selector if needed',
                'Fill fiat amount input',
                'Fill crypto amount input',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select asset to buy (if different from default)',
                'Select country and try changing it',
                'Select payment method',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and verify transition to next step',
            ],
            category: TestCategory.Buy,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
