import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Dashboard', { tag: ['@group=manual'] }, () => {
    test(
        'Portfolio graph',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that the dashboard portfolio graph renders correct data.',
                prerequisites: ['Seeded Trezor device with transactions', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to the Dashboard',
                    'Confirm the portfolio graph is rendered with data',
                    'Hover over the graph and confirm a tooltip with date and value is shown',
                    'Switch the graph time range (e.g. 1D, 1W, 1M, 1Y, All)',
                    'Confirm the graph re-renders for every range',
                    'Change the fiat currency in Settings and confirm the graph values update',
                ],
                category: TestCategory.Dashboard,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'My assets',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the "My assets" section shows correct balances and navigation.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with multiple networks enabled',
                ],
                steps: [
                    'Navigate to the Dashboard and locate the "My assets" section',
                    'Confirm each enabled network with funds is listed with crypto and fiat balance',
                    'Confirm the current exchange rate and price change are displayed per asset',
                    'Switch between table and grid layout (if available) and confirm both render correctly',
                    'Click an asset and confirm the app navigates to its account(s)',
                    'Enable a new coin in Settings and confirm it appears in "My assets" after discovery',
                ],
                category: TestCategory.Dashboard,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
