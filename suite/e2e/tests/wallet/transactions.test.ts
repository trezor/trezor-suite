import { messages } from '@suite/intl';

import { expect, test } from '../../support/fixtures';
import { graphRangeOptions } from '../../support/pageObjects/dashboardPage';

const rangeData: { range: graphRangeOptions; label: string }[] = [
    { range: 'day', label: messages['TR_DATE_DAY_LONG'].defaultMessage },
    { range: 'week', label: messages['TR_DATE_WEEK_LONG'].defaultMessage },
    { range: 'month', label: messages['TR_DATE_MONTH_LONG'].defaultMessage },
    { range: 'year', label: messages['TR_DATE_YEAR_LONG'].defaultMessage },
    { range: 'all', label: messages['TR_ALL'].defaultMessage },
];

test.describe('Account transactions overview', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
    });

    test('Check graph span and search a transaction by BTC address', async ({
        walletPage,
        dashboardPage,
    }) => {
        await test.step('Cycle thru all time range filters', async () => {
            await walletPage.openAccount({ symbol: 'btc' });
            for (const { range, label } of rangeData) {
                await dashboardPage.graphRangeSelector(range).click();
                const labelElement = walletPage.transactionSummaryTitle.getByText(label);
                await expect(labelElement).toBeVisible();
            }
        });

        const latestTransactionAddress = await test.step('Find the latest transaction', async () =>
            (await walletPage.transactionAddress.first().textContent())
                ?.replace(/\s/g, '')
                .slice(-4));

        if (!latestTransactionAddress) {
            throw new Error('No latest transaction found');
        }

        await test.step('Search for latest transaction by its address', async () => {
            await walletPage.transactionSearch.fill(latestTransactionAddress);
            await expect(walletPage.transactionItem.first()).toBeVisible();
        });

        // go to a certain accounts page and verify you are on that page
        // await page.getByTestId('@account-menu/legacy').click();
        // await walletPage.openAccount({ symbol: 'btc', type: 'legacy' });
    });
});
