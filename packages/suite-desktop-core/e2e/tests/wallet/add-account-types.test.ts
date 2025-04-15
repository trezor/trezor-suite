import { NetworkSymbol } from '@suite-common/wallet-config';
import { EventType } from '@trezor/suite-analytics';

import { createTestAnnotation } from '../../support/annotations';
import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { ExtractByEventType } from '../../support/types';

test.describe('Account types suite', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorSetupConf: {
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
            const accountTypes = [
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

            const coinsWithoutBTC = accountTypes
                .map(account => account.coin)
                .filter(coin => coin !== 'btc');

            await settingsPage.changeNetworks({
                enableNetworks: coinsWithoutBTC as NetworkSymbol[],
            });
            await dashboardPage.navigateTo();

            const chevrons = await walletPage.accountChevron.all();
            for (const chevron of chevrons) {
                await chevron.click();
            }

            for (const { coin, accounts } of accountTypes) {
                for (const { type } of accounts) {
                    await test.step(`Add and verify ${type} account for ${coin}`, async () => {
                        const numberOfAccountsBefore = await page
                            .getByTestId(`@account-menu/${type}/group`)
                            .locator(
                                ':scope > *:not([data-testid="@account-menu/account-item-skeleton"])',
                            )
                            .count();

                        await page.getByTestId('@account-menu/add-account').click();
                        await expect(page.getByTestId('@modal')).toBeVisible();
                        await page.getByTestId(`@settings/wallet/network/${coin}`).click();
                        await page.getByTestId('@add-account-type/select/input').click();
                        await page.waitForTimeout(500);
                        await page.getByTestId(`@add-account-type/select/option/${type}`).click();
                        await page.getByTestId('@add-account').click();

                        const numberOfAccountsAfter = await page
                            .getByTestId(`@account-menu/${type}/group`)
                            .locator(
                                ':scope > *:not([data-testid="@account-menu/account-item-skeleton"])',
                            )
                            .count();

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
        async ({ page, dashboardPage, settingsPage, walletPage, analytics }) => {
            const coins = [
                { symbol: 'ada', path: `m/1852'/1815'/1'` },
                { symbol: 'eth', path: `m/44'/60'/0'/0/1` },
            ];

            await settingsPage.navigateTo('coins');
            for (const coin of coins) {
                await settingsPage.coins.enableNetwork(coin.symbol as NetworkSymbol);
            }

            await dashboardPage.dashboardMenuButton.click();
            await walletPage.openAccount();
            await page.discoveryShouldFinish();

            analytics.interceptAnalytics();
            await page.getByTestId(`@account-menu/filter-accounts`).click();
            for (const coin of coins) {
                await test.step(`Add and verify ${coin.symbol} account`, async () => {
                    analytics.requests = [];
                    await page.getByTestId(`@account-menu/filter/${coin.symbol}`).click();
                    const numberOfAccountsBefore = await page
                        .getByTestId('@account-menu/normal/group')
                        .locator(`> [data-testid^="@account-menu/${coin.symbol}/normal/"]`)
                        .count();

                    await page.getByTestId('@account-menu/add-account').click();
                    await expect(page.getByTestId('@modal')).toBeVisible();
                    await page.getByTestId(`@settings/wallet/network/${coin.symbol}`).click();
                    await page.getByTestId('@add-account').click();
                    await page.discoveryShouldFinish();

                    const numberOfAccountsAfter = await page
                        .getByTestId('@account-menu/normal/group')
                        .locator(`> [data-testid^="@account-menu/${coin.symbol}/normal/"]`)
                        .count();
                    expect(numberOfAccountsAfter).toEqual(numberOfAccountsBefore + 1);

                    const newAccountEvent = analytics.findAnalyticsEventByType<
                        ExtractByEventType<EventType.AccountsNewAccount>
                    >(EventType.AccountsNewAccount);
                    expect(newAccountEvent.symbol).toEqual(coin.symbol);
                    expect(newAccountEvent.path).toEqual(coin.path);
                    expect(newAccountEvent.type).toEqual('normal');
                });
            }
        },
    );
});
