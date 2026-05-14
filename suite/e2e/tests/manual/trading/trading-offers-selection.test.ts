import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading offers selection', { tag: ['@group=manual'] }, () => {
    test(
        'Compare all offers functionality',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies the "Compare all offers" modal functionality.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a wallet connected',
                    'Fill a Trade Form (Buy/Sell/Exchange) with valid inputs to load offers',
                ],
                steps: [
                    'Click the provider row on the trading form to open the offers modal',
                    'Observe offers loading state',
                    'Verify offers are loaded and displayed in the modal',
                    'Offers Filtering (Exchange only):',
                    ' - Filter by All / CEX / DEX tabs',
                    ' - Filter by KYC options',
                    'Check an Offer:',
                    ' - Check provider name and rate displayed per offer',
                    'Select an Offer:',
                    ' - Click on an offer row',
                    ' - Verify modal closes and selected offer is reflected on the form',
                    ' - Verify transition to the Provider/Confirmation flow',
                ],
                category: TestCategory.General,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
