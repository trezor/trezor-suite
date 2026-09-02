import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Trading account and fees', { tag: ['@group=manual'] }, () => {
    test(
        'Receive account selection and Suite Sync labels',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Trade receive account picker (Suite, add account, non-Suite) and that Suite Sync account/address labels appear in the picker.',
                prerequisites: [
                    'Seeded Trezor device supporting Suite Sync',
                    'Connected Trezor Suite with Suite Sync enabled',
                    'Custom Suite Sync label set on at least one account (and address label if shown)',
                    'Multiple Suite accounts and ability to add an account on the receive network',
                ],
                steps: [
                    'Open Trade → Buy (or Swap with a To asset that needs a receive account)',
                    'Open Receive account',
                    'Confirm Suite accounts are listed and the Suite Sync custom account label is shown (not only the default "Network #n" when a sync label exists)',
                    'If address labels are shown for Suite receive addresses, confirm the Suite Sync address label appears',
                    'Select a different Suite receive account; confirm the form updates',
                    'Use add Suite account if offered; confirm a new account can be created and selected',
                    'Select a non-Suite / custom receive address option; confirm the address is accepted or validated',
                    'Return to a Suite account and confirm the selection sticks on the form',
                ],
                category: TestCategory.TradeTab,
                priority: TestPriority.Medium,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );

    test(
        'Buy has no network fee picker',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies Buy has no network Maximum fee / Low-Normal-High-Customize fee picker (Sell / Swap / approval fee checks live in those flow tests).',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite with a wallet'],
                steps: [
                    'Open Trade → Buy with a valid amount so a quote can load',
                    'Confirm there is no network Maximum fee control and no Low / Normal / High / Customize fee picker on Buy',
                ],
                category: TestCategory.Buy,
                priority: TestPriority.Low,
                stream: TestStream.Trade,
            }),
        },
        async () => {},
    );
});
