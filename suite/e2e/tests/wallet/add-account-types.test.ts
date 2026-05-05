import { events } from '@suite/analytics';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

test.describe('Account types suite', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'Add account types btc-like',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can add different account types for BTC-like coins.',
                category: TestCategory.Accounts,
                priority: TestPriority.Critical,
            }),
        },
        async ({ page, dashboardPage, settingsPage, walletPage }) => {
            const accountTypes: { coin: NetworkSymbol; accounts: { type: string }[] }[] = [
                {
                    coin: 'btc',
                    accounts: [
                        { type: 'normal' },
                        { type: 'taproot' },
                        { type: 'segwit' },
                        { type: 'legacy' },
                    ],
                },
                {
                    coin: 'ltc',
                    accounts: [{ type: 'normal' }, { type: 'segwit' }, { type: 'legacy' }],
                },
            ];

            await settingsPage.changeNetworks({
                enableNetworks: accountTypes.map(account => account.coin) as NetworkSymbol[],
            });
            await dashboardPage.navigateTo();

            await walletPage.expandAllAccountsInMenu();

            for (const { coin, accounts } of accountTypes) {
                for (const { type } of accounts) {
                    await test.step(`Add and verify ${type} account for ${coin}`, async () => {
                        const numberOfAccountsBefore =
                            await walletPage.getAccountsInTypeGroupCount(type);

                        await walletPage.addAccountButton.click();
                        await expect(settingsPage.modal).toBeVisible();
                        await settingsPage.coinsTab.networkButton(coin).click();
                        await walletPage.addAccountTypeSelectInput.click();
                        await page.waitForTimeout(500);
                        await walletPage.addAccountTypeSelectOption(type).click();
                        await walletPage.addAccountConfirmButton.click();

                        const numberOfAccountsAfter =
                            await walletPage.getAccountsInTypeGroupCount(type);

                        expect(numberOfAccountsAfter).toEqual(numberOfAccountsBefore + 1);
                    });
                }
            }
        },
    );

    test(
        'Add-account-types-non-BTC-coins',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can add different account types for non-BTC coins.',
                category: TestCategory.Accounts,
                priority: TestPriority.High,
            }),
        },
        async ({ dashboardPage, settingsPage, walletPage, analytics }) => {
            const coins: { symbol: NetworkSymbol; path: string }[] = [
                { symbol: 'ada', path: `m/1852'/1815'/1'` },
                { symbol: 'eth', path: `m/44'/60'/0'/0/1` },
                { symbol: 'base', path: `m/44'/60'/0'/0/1` },
            ];

            const symbolsToEnable = coins.map(c => c.symbol) as NetworkSymbol[];
            await settingsPage.changeNetworks({
                enableNetworks: symbolsToEnable,
            });

            await dashboardPage.dashboardMenuButton.click();
            await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });

            analytics.interceptAnalytics();
            await walletPage.filterAccountsButton.click();
            for (const coin of coins) {
                await test.step(`Add and verify ${coin.symbol} account`, async () => {
                    analytics.requests = [];
                    await walletPage.walletFilter(coin.symbol).click();
                    const numberOfAccountsBefore =
                        await walletPage.getAccountsForCoinInTypeGroupCount('normal', coin.symbol);

                    await walletPage.addAccountButton.click();
                    await expect(settingsPage.modal).toBeVisible();
                    await settingsPage.coinsTab.networkButton(coin.symbol).click();
                    await walletPage.addAccountConfirmButton.click();

                    const numberOfAccountsAfter =
                        await walletPage.getAccountsForCoinInTypeGroupCount('normal', coin.symbol);
                    expect(numberOfAccountsAfter).toEqual(numberOfAccountsBefore + 1);

                    const newAccountEvent = analytics.findAnalyticsEventByType<
                        ExtractByEventType<(typeof events.accountsNewAccountEvent)['name']>
                    >(events.accountsNewAccountEvent.name);
                    expect(newAccountEvent.symbol).toEqual(coin.symbol);
                    expect(newAccountEvent.path).toEqual(coin.path);
                    expect(newAccountEvent.type).toEqual('normal');
                });
            }
        },
    );
});
