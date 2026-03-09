import { getCryptoId } from '@suite-common/trading';

import { invityEndpoint, swapQuotesTetherStellar } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const sendAmount = swapQuotesTetherStellar[0].sendStringAmount!;

test.describe(
    'Trading - Swap token to disabled network asset',
    {
        tag: ['@webOnly', '@T3W1', '@T3T1'],
    },
    () => {
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });

        test.beforeEach(
            async ({ page, onboardingPage, dashboardPage, walletPage, settingsPage }) => {
                await test.step('Mocking responses', async () => {
                    await page.route(invityEndpoint.swapQuotes, async route => {
                        await route.fulfill({ json: swapQuotesTetherStellar });
                    });
                });

                await onboardingPage.completeOnboarding();
                await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
                await dashboardPage.openDeviceSwitcher();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openSwapTrading({ symbol: 'sol' });
            },
        );

        test('Show provider info for disabled network asset XLM', async ({ tradingPage }) => {
            await test.step('Fill in a Swap form with Stellar buy asset', async () => {
                await tradingPage.fillSwapForm({
                    amount: sendAmount,
                    sellAsset: {
                        networkSymbol: 'sol',
                        tokenSymbol: 'USDT',
                    },
                    buyAsset: {
                        searchFilter: 'XLM',
                        networkFilter: 'xlm',
                        assetCryptoId: getCryptoId('xlm'),
                    },
                });
            });

            await test.step('Verify provider info is visible in quotes', async () => {
                await expect(tradingPage.quotes.selectedProvider).toBeVisible();
            });
        });
    },
);
