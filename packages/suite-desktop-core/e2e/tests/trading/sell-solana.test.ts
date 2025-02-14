import { Request, Route } from '@playwright/test';

import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesSolana,
    sellTradeSolana,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const mnemonic =
    'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(sellQuotesSolana[0].fiatStringAmount, 'en', 2, 2);
const cryptoAmount = sellQuotesSolana[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesSolana[0].exchange, 'sellList');
const providerAddress = '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK';
const providerPaymentId = '6d666a5f-b99c-4482-b8bc-2df04fc11b7b';
const formattedCryptoAmount = `${cryptoAmount} SOL`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeSolana.trade;

function catchSolanaSendRequest(route: Route, request: Request) {
    const method = request.method();
    const postData = request.postData();

    if (method === 'POST' && postData) {
        const postDataJson = JSON.parse(postData);
        if (postDataJson.method === 'getLatestBlockhash') {
            route.continue();

            return;
        }
    }

    // Abort all other requests matching the solPattern
    route.abort();
}

test.describe('Trading - Sell', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic, passphrase_protection: true },
    });
    test.beforeEach(
        async ({ page, marketPage, onboardingPage, dashboardPage, settingsPage, walletPage }) => {
            if (!process.env.PASSPHRASE) {
                throw new Error(
                    'PASSPHRASE not provided in env variables. Check docs/tests/e2e-playwright-suite.md.',
                );
            }
            await marketPage.mockInvity();
            await marketPage.mockInvityTrade(sellTradeSolana, invityEndpoint.sellTrade);
            await page.route(invityEndpoint.sellQuotes, async route => {
                await route.fulfill({ json: sellQuotesSolana });
            });
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({
                    json: {
                        status: 'SEND_CRYPTO',
                        destinationAddress: providerAddress,
                        destinationPaymentExtraId: providerPaymentId,
                    },
                });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('sol');
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await dashboardPage.discoveryShouldFinish();
            await walletPage.openTrading({ symbol: 'sol' });
            await marketPage.sellTabButton.click();
        },
    );

    test('Sell Solana', async ({ page, marketPage, devicePrompt, trezorUserEnvLink }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.selectCountryOfResidence('CZ');
            await marketPage.youPayCryptoInput.fill(cryptoAmount);
            await marketPage.waitForSellOffersSync();
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.formSellButton.click();
            await marketPage.sellTermsConfirmButton.click();
        });
        await test.step('Wait for the redirection to complete', async () => {
            await expect(page.getByText('Buy & sell')).not.toBeVisible();
            await expect(page.getByText('Buy & sell')).toBeVisible({ timeout: 15_000 });
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(provider);
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(marketPage.confirmationAddress).toHaveText(providerAddress);
            await expect(marketPage.confirmationAccount).toHaveText('Solana #1');
            await expect(page.getByTestId('@trading/form/verify/extra-id')).toHaveText(
                providerPaymentId,
            );
        });

        await test.step('Initiate send', async () => {
            await marketPage.confirmTradeButton.click();
            await expect(devicePrompt.sellButton).toBeDisabled();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(formattedCryptoAmount);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            // Note: We intentionally skip clicking the sell button in tests to prevent actual cryptocurrency transactions.
            // In a real scenario, the user would complete the transaction by clicking this button.
            await expect(devicePrompt.sellButton).toBeEnabled();
        });

        await test.step('Risk it for the biscuit', async () => {
            const solUrlPattern = /^https:\/\/sol\d+\.trezor\.io\//;
            await page.route(solUrlPattern, catchSolanaSendRequest);
            await page.pause();
            // await devicePrompt.sellButton.click();
        });
    });
});
