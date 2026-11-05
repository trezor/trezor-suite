import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Swap SOL via CEX',
        {
            testCase: 'Verifies that a user can swap SOL via CEX in the mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a funded Solana wallet',
            ],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Select from asset as SOL',
                'Select to asset as a token',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and proceed with the swap flow',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );

    it(
        'Swap SPL Token via CEX',
        {
            testCase: 'Verifies that a user can swap SPL token via CEX in the mobile app.',
            prerequisites: [
                'Seeded Trezor device',
                'Trezor Suite Lite with a funded Solana wallet containing SPL tokens',
            ],
            steps: [
                'Open Trade tab and select Swap',
                'Select wallet/account in the header selector if needed',
                'Select from asset as an SPL token',
                'Select to asset as a target coin',
                'Fill crypto amount',
                'Verify Continue is disabled when required fields are missing and enabled when form is valid',
                'Select receive account and verify validation when no account is selected',
                'Open Provider button and verify provider list and filters are available',
                'Verify KYC or identity warning updates when changing provider',
                'Verify Trade history action is present',
                'Verify provider terms link at the bottom matches selected provider',
                'Tap Continue and proceed with the swap flow',
            ],
            category: TestCategory.Swap,
            priority: TestPriority.High,
            stream: TestStream.Trade,
        },
        async () => {},
    );
});
