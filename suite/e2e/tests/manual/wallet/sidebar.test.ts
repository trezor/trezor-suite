import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Sidebar', { tag: ['@group=manual'] }, () => {
    test(
        'Account search and network filter',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that accounts can be searched by text and filtered by network in the sidebar.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with multiple networks enabled (e.g. BTC, ETH, SOL)',
                ],
                steps: [
                    'Check the sidebar accounts panel',
                    'Confirm the accounts are displayed in the expected order',
                    'Type part of an account name into the search field',
                    'Confirm only matching accounts are displayed',
                    'Search by token, account label and account type and confirm each matches the expected accounts',
                    'Clear the search and confirm all accounts are displayed again',
                    'Use the network filter and select one network (e.g. ETH)',
                    'Confirm only accounts of the selected network are displayed',
                    'Select multiple networks and confirm accounts of all selected networks are displayed',
                    'Combine search text with a network filter and confirm both are applied together',
                    'Clear the filter and confirm the full account list is restored',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
