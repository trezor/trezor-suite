import { expect, test } from '../../support/fixtures';
import { graphRangeOptions } from '../../support/pageObjects/dashboardPage';

const rangeData: { range: graphRangeOptions; label: string }[] = [
    { range: 'day', label: '1 day' },
    { range: 'week', label: '1 week' },
    { range: 'month', label: '1 month' },
    { range: 'year', label: '1 year' },
    { range: 'all', label: 'All' },
];

test.describe('Account transactions overview', { tag: ['@group=wallet'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
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
            await walletPage.transactionAddress.first().textContent());

        if (!latestTransactionAddress) {
            throw new Error('No latest transaction found');
        }

        await test.step('Search for latest transaction by its address', async () => {
            await walletPage.transactionSearch.fill(latestTransactionAddress);
            await expect(walletPage.transactionItem).toHaveCount(1);
            await expect(walletPage.transactionItem).toContainText(latestTransactionAddress);
        });

        // go to a certain accounts page and verify you are on that page
        // await page.getByTestId('@account-menu/legacy').click();
        // await walletPage.openAccount({ symbol: 'btc', type: 'legacy' });
    });
});
