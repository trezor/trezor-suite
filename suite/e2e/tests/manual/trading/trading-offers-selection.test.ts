import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading offers selection', { tag: ['@group=manual'] }, () => {
    test(
        'Compare all offers functionality',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies the "Compare all offers" page functionality.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Trezor Suite with a wallet connected',
                    'Proceed through a Trade Form (Buy/Sell/Exchange) to the Offers page',
                ],
                steps: [
                    'Observe offers loading state',
                    'Verify offers are loaded and displayed',
                    'Verify "Trade history" button is present',
                    'Offers Sorting/Filtering:',
                    ' - Sort by Best Rate / Lowest Fee / etc. if available',
                    ' - Filter by Provider type (All CEX & DEX offers)',
                    ' - Filter by KYC options',
                    'Check an Offer:',
                    ' - Check breakdown of fees/rates',
                    'Select an Offer:',
                    ' - Click "Select"',
                    ' - Verify transition to the Provider/Confirmation flow',
                    'Reload/Refresh Offers:',
                    ' - Wait for offers to be refreshed (30 seconds)',
                ],
                category: TestCategory.General,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
