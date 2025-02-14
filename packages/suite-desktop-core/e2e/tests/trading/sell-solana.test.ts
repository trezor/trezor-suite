import { Request, Route } from '@playwright/test';

import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesSolana,
    sellTradeSolana,
} from '../../fixtures/invity';
import {
    getSignatureStatusesResponse,
    sendTransactionResponse,
} from '../../fixtures/solana-responses';
import { expect, test } from '../../support/fixtures';

const mnemonic =
    'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(sellQuotesSolana[0].fiatStringAmount, 'en', 2, 2);
const cryptoAmount = sellQuotesSolana[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesSolana[0].exchange, 'sellList');
// This address belongs to QA passphrase wallet. So if me make mistake in updating the test case,
// and actually send crypto. It will be sent to this address and we will not lose it.
const providerAddress = '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK';
const providerPaymentId = '6d666a5f-b99c-4482-b8bc-2df04fc11b7b';
const formattedCryptoAmount = `${cryptoAmount} SOL`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeSolana.trade;
const toastText = `${formattedCryptoAmount} sent from Solana #1`;

function mockSolanaSendRequests(route: Route, request: Request) {
    const method = request.method();
    const postData = request.postData();

    if (method === 'POST' && postData) {
        const postDataJson = JSON.parse(postData);

        //IMPORTANT: Mocking this request prevents from actually sending crypto
        if (postDataJson.method === 'sendTransaction') {
            route.fulfill({ json: sendTransactionResponse(postDataJson.id) });

            return;
        }

        if (postDataJson.method === 'getSignatureStatuses') {
            route.fulfill({ json: getSignatureStatusesResponse(postDataJson.id) });

            return;
        }
    }
}

test.describe('Trading - Sell Solana', { tag: ['@group=other', '@webOnly'] }, () => {
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
            await expect(devicePrompt.sellButton).toBeEnabled();
        });

        await test.step('Send crypto to provider', async () => {
            const solUrlPattern = /^https:\/\/sol\d+\.trezor\.io\//;
            //IMPORTANT: Mocking this request prevents from actually sending crypto
            await page.route(solUrlPattern, mockSolanaSendRequests);
            await page.clock.install();
            await devicePrompt.sellButton.click();
            await expect(devicePrompt.sellButton).toHaveText('Confirming transaction');
            await expect(page.getByTestId('@trading/detail-sell/pending')).toHaveText(
                'Trade in progress...',
            );
            await expect(
                page.getByRole('link', { name: "Open partner's support site" }),
            ).toBeVisible();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
        });

        await test.step('Wait 30s for watch refresh and change of status to Success', async () => {
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: { status: 'SUCCESS' } });
            });
            await page.clock.fastForward(marketPage.watchPeriod);
            await expect(page.getByTestId('@trading/detail-sell/success-title')).toHaveText(
                'Trade success',
            );
        });
    });
});
