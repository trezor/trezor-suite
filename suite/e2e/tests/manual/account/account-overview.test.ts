import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account overview', { tag: ['@group=manual'] }, () => {
    test(
        'Account graph and summary tiles',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the account graph and the All/Incoming/Outgoing tiles render correct data.',
                prerequisites: [
                    'Seeded Trezor device with transactions (e.g. "all" seed)',
                    'Connected Trezor Suite',
                ],
                steps: [
                    'Navigate to an account with transaction history',
                    'Confirm the account graph is rendered with data',
                    'Hover over the graph and confirm a tooltip with date and value is shown',
                    'Switch the graph time range and confirm it re-renders for every range',
                    'Confirm the "All", "Incoming" and "Outgoing" tiles display values',
                    'Switch between the tiles and confirm the graph/summary updates accordingly',
                    'Cross-check the tile values roughly match the transaction history',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Tron energy and bandwidth',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that Tron account displays energy and bandwidth resources correctly.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Tron account, ideally with frozen TRX (non-zero energy/bandwidth)',
                ],
                steps: [
                    'Navigate to the Tron account',
                    'Confirm the energy and bandwidth values are displayed on the account page',
                    'Confirm the values match the on-chain state (cross-check with a Tron explorer)',
                    'Send a TRX transaction and confirm bandwidth consumption is reflected afterwards',
                    'Confirm the send flow communicates when energy/bandwidth covers the fee vs. when TRX is burned',
                ],
                category: TestCategory.Coins,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
