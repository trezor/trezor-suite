import fs from 'fs';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { expect, test } from '../../support/fixtures';
import { ExportType } from '../../support/pageObjects/walletPage';

test.describe('Export transactions', { tag: ['@group=wallet', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });
    test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage }) => {
        await onboardingPage.completeOnboarding();
        await walletPage.openAccount();
        await dashboardPage.discoveryShouldFinish();
    });

    /* Test case
     * 1. Start in Coin section
     * 2. Activate all tested coins
     * 3. Pass discovery
     * 4. Navigate to First accounts Wallet
     * 5. Download transaction history in all 3 formats
     * 6. Check that 3 files were downloaded successfully
     * 7. Repeat for all tested coins
     */
    test('Go to account and try to export all possible variants (pdf, csv, json)', async ({
        page,
        dashboardPage,
        settingsPage,
        walletPage,
        onboardingPage,
    }) => {
        const symbols: NetworkSymbol[] = ['btc', 'ltc', 'eth', 'ada'];
        await settingsPage.navigateTo('coins');
        for (const symbol of symbols.filter(s => s !== 'btc')) {
            await settingsPage.coins.enableNetwork(symbol);
        }

        await dashboardPage.dashboardMenuButton.click();
        await dashboardPage.discoveryShouldFinish();

        for (const symbol of symbols) {
            await walletPage.openAccount({ symbol });

            const typesOfExport: ExportType[] = ['pdf', 'csv', 'json'];
            await onboardingPage.completeTransactionOnboarding();
            for (const type of typesOfExport) {
                await walletPage.exportTransactions(type);
                const download = await page.waitForEvent('download');
                expect(await download.failure()).toBeNull();

                const fileName = download.suggestedFilename();
                expect(fileName).toMatch(new RegExp(`.(${type})`));

                const downloadPath = await download.path();
                const stats = fs.statSync(downloadPath);
                expect(stats.size).toBeGreaterThan(0);
            }
        }
    });
});
