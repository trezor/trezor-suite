import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesSolana,
    sellTradeSolana,
    sellWatchSolana,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(sellQuotesSolana[0].fiatStringAmount, 'en', 2, 2);
const cryptoAmount = sellQuotesSolana[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesSolana[0].exchange, 'sellList');
// This address belongs to second account in this wallet.
// So if me make mistake in updating the test case, and actually send crypto.
// It will be sent to this address and we will not lose it.
const providerAddress = sellWatchSolana.destinationAddress;
const formattedCryptoAmount = `${cryptoAmount} SOL`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeSolana.trade;
const formattedAddress = formatAddress(sellWatchSolana.destinationAddress);
const toastText = `${formattedCryptoAmount} sent from Solana #1`;

test.describe('Trading - Sell Solana', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({
            page,
            tradingPage,
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

            await test.step('Enable Solana and open its sell trading', async () => {
                await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openTrading({ symbol: 'sol' });
                await tradingPage.sellTabButton.click();
            });
        },
    );

    test('Sell Solana', async ({ page, tradingPage, tradingMock, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            const solanaFeePromise = tradingPage.fees.promiseForResponseSolanaFeeCalls();
            await tradingPage.fillSellForm(cryptoAmount, 'solana');
            // Automation is too fast, we need to wait for Fees to be resolved
            await solanaFeePromise;
            await expect(tradingPage.fees.miscAmount).toBeVisible();
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await tradingPage.sellBestOfferButton.click();
            await tradingPage.termsConfirmButton.click();
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.confirmationAddress).toHaveText(providerAddress);
            await expect(tradingPage.confirmationAccount).toHaveText('Solana #1');
        });

        await test.step('Initiate send', async () => {
            await tradingPage.initiateSendConfirmation();
            await expect(devicePrompt.headerParagraph).toContainText('Solana #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedAddress);
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                formattedCryptoAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
        });

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await expect(tradingPage.transactionDetailStatus).toHaveText('Trade in progress...');
            await expect(
                page.getByRole('link', { name: "Open partner's support site" }),
            ).toBeVisible();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
        });

        await test.step('Wait 30s for watch refresh and status change to Success', async () => {
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: { status: 'SUCCESS' } });
            });
            await page.clock.fastForward(tradingMock.watchPeriod);
            await expect(tradingPage.transactionDetailStatus).toHaveText('Trade success');
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Return to account sell form', async () => {
            await tradingPage.backToAccountButton.click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/sell#\/sol\/0\/normal$/);
        });
    });

    test('Sell Solana for compared offer', async ({ page, tradingPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            const solanaFeePromise = tradingPage.fees.promiseForResponseSolanaFeeCalls();
            await tradingPage.fillSellForm(cryptoAmount, 'solana');
            // Automation is too fast, we need to wait for Fees to be resolved
            await solanaFeePromise;
            await expect(tradingPage.fees.miscAmount).toBeVisible();
            await tradingPage.compareButton.click();
        });
        await page.pause();
        await expect(tradingPage.youPayCryptoInput).toHaveValue(cryptoAmount);

        await test.step('Check compared offers', async () => {
            await expect(tradingPage.youPayCryptoInput).toHaveValue(cryptoAmount);
            await expect(tradingPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(tradingPage.paymentMethodDropdown).toHaveText(paymentMethodName);
            await tradingPage.validateSellQuotes(sellQuotesSolana);
        });

        await test.step('Change payment method to Bank Transfer', async () => {
            await tradingPage.selectPaymentMethod('bankTransfer');
            await tradingPage.validateSellQuotes(sellQuotesSolana);
        });

        await test.step('Select second offer and check correct values are sent in trade request', async () => {
            await tradingPage.selectThisQuoteButton.nth(1).click();
            const sellTradePromise = page.waitForRequest(invityEndpoint.sellTrade);
            await tradingPage.termsConfirmButton.click();
            await expect(sellTradePromise).toHavePayload(
                {
                    // the second chosen offer via Bank Transfer that matches input criteria has index 3
                    trade: sellQuotesSolana[3],
                },
                {
                    omit: ['returnUrl', 'trade.orderId', 'trade.paymentId', 'trade.refundAddress'],
                },
            );
        });
    });
});
