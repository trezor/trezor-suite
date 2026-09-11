import { events } from '@suite/analytics';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

const ethSymbol = asNetworkSymbol('eth');

test.describe('Account types suite', { tag: ['@T3W1', '@T3T1'] }, () => {
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
                stream: TestStream.Wallet,
            }),
        },
        async ({ dashboardPage, settingsPage, walletPage }) => {
            const accountTypes: { coin: NetworkSymbol; accounts: { type: string }[] }[] = [
                {
                    coin: asNetworkSymbol('btc'),
                    accounts: [
                        { type: 'normal' },
                        { type: 'taproot' },
                        { type: 'segwit' },
                        { type: 'legacy' },
                    ],
                },
                {
                    coin: asNetworkSymbol('ltc'),
                    accounts: [{ type: 'normal' }, { type: 'segwit' }, { type: 'legacy' }],
                },
            ];

            await settingsPage.changeNetworks({
                enableNetworks: accountTypes.map(account => account.coin),
            });
            await dashboardPage.navigateTo();

            // The account menu is virtualized, so only rows inside the rendered window are
            // counted. Filtering to the coin under test keeps every one of its rows rendered.
            await walletPage.filterAccountsButton.click();

            for (const { coin, accounts } of accountTypes) {
                await walletPage.walletFilter(coin).click();

                for (const { type } of accounts) {
                    await test.step(`Add and verify ${type} account for ${coin}`, async () => {
                        const numberOfAccountsBefore =
                            await walletPage.getAccountsForCoinInTypeCount(type, coin);

                        await walletPage.addAccountButton.click();
                        await expect(walletPage.addAccountNetworkSearchInput).toBeVisible();
                        await walletPage.addAccountNetworkSearchInput.fill(coin);
                        await expect(walletPage.addAccountNetworkButton(ethSymbol)).toBeHidden();
                        await walletPage.addAccountNetworkButton(coin).click();
                        await walletPage.addAccountTypeSelectInput.click();
                        await walletPage.addAccountTypeSelectOption(type).click();
                        await walletPage.addAccountConfirmButton.click();
                        await walletPage.closeAddAccountModal();

                        const numberOfAccountsAfter =
                            await walletPage.getAccountsForCoinInTypeCount(type, coin);

                        expect(numberOfAccountsAfter).toEqual(numberOfAccountsBefore + 1);
                    });
                }

                await walletPage.walletFilter(coin).click();
            }
        },
    );

    const runNonBtcCoinsTest = async (
        coins: { symbol: NetworkSymbol; path: string }[],
        {
            dashboardPage,
            settingsPage,
            walletPage,
            analytics,
        }: Pick<
            Parameters<Parameters<typeof test>[2]>[0],
            'dashboardPage' | 'settingsPage' | 'walletPage' | 'analytics'
        >,
    ) => {
        const symbolsToEnable = [...new Set([ethSymbol, ...coins.map(c => c.symbol)])];
        await settingsPage.changeNetworks({ enableNetworks: symbolsToEnable });

        await dashboardPage.dashboardMenuButton.click();
        await walletPage.openAccount({ symbol: ethSymbol, type: 'normal', atIndex: 0 });

        analytics.interceptAnalytics();
        await walletPage.filterAccountsButton.click();
        for (const coin of coins) {
            await test.step(`Add and verify ${coin.symbol} account`, async () => {
                analytics.requests = [];
                await walletPage.walletFilter(coin.symbol).click();
                const numberOfAccountsBefore = await walletPage.getAccountsForCoinInTypeCount(
                    'normal',
                    coin.symbol,
                );

                await walletPage.addAccountButton.click();
                await expect(walletPage.addAccountNetworkSearchInput).toBeVisible();
                await walletPage.addAccountNetworkSearchInput.fill(coin.symbol);
                await expect(
                    walletPage.addAccountNetworkButton(asNetworkSymbol('btc')),
                ).toBeHidden();
                await walletPage.addAccountNetworkButton(coin.symbol).click();
                await walletPage.closeAddAccountModal();

                const numberOfAccountsAfter = await walletPage.getAccountsForCoinInTypeCount(
                    'normal',
                    coin.symbol,
                );
                expect(numberOfAccountsAfter).toEqual(numberOfAccountsBefore + 1);

                const newAccountEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<(typeof events.accountsNewAccountEvent)['name']>
                >(events.accountsNewAccountEvent.name);
                expect(newAccountEvent.symbol).toEqual(coin.symbol);
                expect(newAccountEvent.path).toEqual(coin.path);
                expect(newAccountEvent.type).toEqual('normal');
            });
        }
    };

    test(
        'Add-account-types-non-BTC-coins',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can add different account types for non-BTC coins.',
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async ({ dashboardPage, settingsPage, walletPage, analytics }) => {
            await runNonBtcCoinsTest(
                [
                    { symbol: ethSymbol, path: `m/44'/60'/0'/0/1` },
                    { symbol: asNetworkSymbol('base'), path: `m/44'/60'/0'/0/1` },
                ],
                { dashboardPage, settingsPage, walletPage, analytics },
            );
        },
    );

    test(
        'Add account types ada',
        {
            tag: ['@optional'],
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can add different account types for non-BTC coins.',
                category: TestCategory.Accounts,
                priority: TestPriority.Medium,
                stream: TestStream.Wallet,
            }),
        },
        async ({ dashboardPage, settingsPage, walletPage, analytics }) => {
            await runNonBtcCoinsTest(
                [{ symbol: asNetworkSymbol('ada'), path: `m/1852'/1815'/1'` }],
                {
                    dashboardPage,
                    settingsPage,
                    walletPage,
                    analytics,
                },
            );
        },
    );
});
