import fs from 'fs';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { ExportType } from '../../support/pageObjects/walletPage';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Export transactions', { tag: ['@group=wallet', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'Go to account and try to export all possible variants (pdf, csv, json)',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully export transactions in all formats.',
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
            }),
        },
        async ({ page, settingsPage, walletPage, onboardingPage }) => {
            const symbols: NetworkSymbol[] = ['btc', 'ltc', 'eth', 'ada'];
            await settingsPage.changeNetworks({
                enableNetworks: symbols.filter(symbol => symbol !== 'btc'),
            });

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
        },
    );
});
