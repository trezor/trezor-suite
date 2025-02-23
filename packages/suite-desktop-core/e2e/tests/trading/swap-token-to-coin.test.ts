import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesTetherBTC,
    swapTradeTetherBTC,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesTetherBTC[2].sendStringAmount!;
const provider = getCompanyNameFromList(swapQuotesTetherBTC[2].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} USDT`;
const formattedReceiveAmount = `${localizeNumber(swapQuotesTetherBTC[2].receiveStringAmount!)} BTC`;
const { sendAddress, receiveAddress } = swapTradeTetherBTC;
const formattedSendAddress = formatAddress(sendAddress);
const toastText = `${formattedSendAmount} sent from Solana #1`;

test.describe('Trading - Swap token to coin', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesTetherBTC });
                });

                // await page.route(invityEndpoint.swapQuotes, async (route, request) => {
                //     const payload = request.postDataJSON();
                //     payload.sendStringAmount = '900';
                //     await route.continue({ postData: payload });
                // });

                // await page.route(invityEndpoint.swapTrade, async (route, request) => {
                //     const payload = request.postDataJSON();
                //     payload.trade.payload.sendStringAmount = '900';
                //     payload.trade.receiveStringAmount = '873,55057941';
                //     await route.continue({ postData: payload });
                // });

                //only send: Transaction signing error: Missing composed data
                //My mock  : Transaction signing error: Missing composed data

                await tradingMock.routeSwapTrade(swapTradeTetherBTC);
                await tradingMock.routeSolanaSendRequests();
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('sol');
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana Tether token to Bitcoin', async ({ marketPage, page, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            const solanaTetherToken = 'solana--Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
            await marketPage.setYouSwapAmount({
                amount: sendAmount,
                sendCurrency: solanaTetherToken,
                sendTicker: 'USDT',
                receiveCurrency: 'Bitcoin',
                receiveSymbol: 'btc',
                receiveNetwork: 'bitcoin',
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(marketPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await marketPage.swapBestOfferButton.click();
            await marketPage.confirmTrade(formatAddress(receiveAddress));
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationAccountDropdown).toContainText('Bitcoin #1');
            await expect(marketPage.confirmationAddress).toContainText(receiveAddress);
            await expect(marketPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(marketPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(marketPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Finish transaction', async () => {
            await marketPage.finishTransactionButton.click();
            await expect(marketPage.swapTransactionFromAccount).toContainText('Solana #1');
            await expect(marketPage.swapTransactionToAddress).toContainText(formattedSendAddress);
        });

        await test.step('Initiate send', async () => {
            await marketPage.initiateSendConfirmation();
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(formattedSendAmount);
        });
        await page.pause();

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
        });
    });
});
