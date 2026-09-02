import fs from 'fs';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { ExportType } from '../../support/pageObjects/walletPage';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Export transactions', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    const runExport = async (
        symbols: NetworkSymbol[],
        {
            page,
            settingsPage,
            walletPage,
            onboardingPage,
        }: Pick<
            Parameters<Parameters<typeof test>[2]>[0],
            'page' | 'settingsPage' | 'walletPage' | 'onboardingPage'
        >,
    ) => {
        await settingsPage.changeNetworks({ enableNetworks: symbols });

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
    };

    test(
        'Go to account and try to export all possible variants (pdf, csv, json)',
        {
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully export transactions in all formats.',
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async ({ page, settingsPage, walletPage, onboardingPage }) => {
            await runExport(['btc', 'ltc', 'eth'], {
                page,
                settingsPage,
                walletPage,
                onboardingPage,
            });
        },
    );

    test(
        'Go to account and try to export all possible variants (pdf, csv, json) - ada',
        {
            tag: ['@nightlyOnly'],
            annotation: createTestAnnotation({
                testCase: 'Verify that a user can successfully export transactions in all formats.',
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async ({ page, settingsPage, walletPage, onboardingPage }) => {
            await runExport(['ada'], { page, settingsPage, walletPage, onboardingPage });
        },
    );
});
