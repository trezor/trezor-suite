import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesSolana,
    sellTradeSolana,
    sellWatchSolana,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(sellQuotesSolana[0].fiatStringAmount, 'en', 2, 2);
const cryptoAmount = sellQuotesSolana[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesSolana[0].exchange, 'sellList');
// This address belongs to second account in this wallet.
// So if me make mistake in updating the test case, and actually send crypto.
// It will be sent to this address and we will not lose it.
const providerAddress = sellWatchSolana.destinationAddress;
const providerPaymentId = sellWatchSolana.destinationPaymentExtraId;
const formattedCryptoAmount = `${cryptoAmount} SOL`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeSolana.trade;
const toastText = `${formattedCryptoAmount} sent from Solana #1`;

test.describe('Trading - Sell Solana', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
    test.beforeEach(
        async ({
            page,
            marketPage,
            tradingMock,
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
        }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.sellQuotes, async route => {
                    await route.fulfill({ json: sellQuotesSolana });
                });
                await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeSolana);
                //IMPORTANT: Mocking this request prevents from actually sending crypto
                await tradingMock.routeSolanaSendRequests();
                await page.route(invityEndpoint.sellWatch, async route => {
                    await route.fulfill({ json: sellWatchSolana });
                });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            await test.step('Enable Solana and open its sell trading', async () => {
                await settingsPage.navigateTo('coins');
                await settingsPage.coins.enableNetwork('sol');
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openTrading({ symbol: 'sol' });
                await marketPage.sellTabButton.click();
            });
        },
    );

    test('Sell Solana', async ({ page, marketPage, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.setYouSellAmount(cryptoAmount, 'solana');
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.formSellButton.click();
            await marketPage.sellTermsConfirmButton.click();
        });

        await marketPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(provider);
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(marketPage.confirmationAddress).toHaveText(providerAddress);
            await expect(marketPage.confirmationAccount).toHaveText('Solana #1');
            await expect(marketPage.confirmationPaymentId).toHaveText(providerPaymentId);
        });

        await test.step('Initiate send', async () => {
            await marketPage.initiateSendConfirmation();
            await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(formattedCryptoAmount);
        });

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await page.clock.install();
            await devicePrompt.sellButton.click();
            await expect(marketPage.detailSellStatus).toHaveText('Trade in progress...');
            await expect(
                page.getByRole('link', { name: "Open partner's support site" }),
            ).toBeVisible();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
        });

        await test.step('Wait 30s for watch refresh and status change to Success', async () => {
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: { status: 'SUCCESS' } });
            });
            await page.clock.fastForward(marketPage.watchPeriod);
            await expect(marketPage.detailSellStatus).toHaveText('Trade success');
        });
    });
});
