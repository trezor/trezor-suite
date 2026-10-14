import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Top navigation - global Send and Receive', { tag: ['@group=manual'] }, () => {
    test(
        'Global Send',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the global Send button in the top navigation opens the send flow with account selection.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with multiple funded accounts',
                ],
                steps: [
                    'From the Dashboard, click the "Send" button in the top navigation',
                    'Confirm an account/asset picker opens',
                    'Confirm the accounts/assets are sorted the same way as in the sidebar',
                    'Search for an asset by name and confirm the list is filtered',
                    'Select a funded account',
                    'Confirm the Send form of the selected account opens',
                    'Repeat from an account page and confirm the picker preselects/offers the current account',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Global Receive',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the global Receive button in the top navigation opens the asset-first receive flow.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'From the Dashboard, click the "Receive" button in the top navigation',
                    'Confirm the Assets tab opens and the Accounts subtab is available',
                    'Confirm My assets are ordered by fiat balance; unheld native coins come first, then tokens in the ranked Suite catalogue order, with no featured assets',
                    'Search by name, symbol, network or contract and confirm the same held/native/catalogue ordering is preserved',
                    'Filter by network and confirm its native coin comes before unheld tokens',
                    'Confirm the catalogue loads without contacting Invity, and an unavailable catalogue offers Retry while the Accounts tab remains usable',
                    'Select an asset with one receive account and confirm the flow continues directly',
                    'Select an asset with multiple receive accounts and choose one in the account step',
                    'Select an asset on an inactive network and confirm setup completes inside the modal',
                    'Open Add account from the Accounts tab, add an account and return to Receive using the back button',
                    'With Bitcoin-only firmware, confirm only Accounts opens, without subtabs, a network filter or catalogue loading',
                    'Confirm the Receive view of the selected account opens',
                    'Reveal an address and confirm it on the device',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
