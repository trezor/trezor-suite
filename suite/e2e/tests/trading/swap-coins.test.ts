import { TranslationKey } from '@suite/intl';
import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaBTC,
    swapTradeSolanaBTC,
} from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

// In beforeEach, We set initial status to 'SENDING'
const transactionStates = [
    {
        transactionStatus: 'CONFIRMING',
        displayedText: 'TR_EXCHANGE_DETAIL_SENDING_TRANSACTION',
    },
    {
        transactionStatus: 'CONVERTING',
        displayedText: 'TR_TRADING_DETAIL_PROCESSING',
        translationValues: (providerName: string) => ({ providerName, type: 'swap' }),
    },
    {
        transactionStatus: 'SUCCESS',
        displayedText: 'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
    },
];

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaBTC[0].sendStringAmount;
const receiveAmount = localizeNumber(swapQuotesSolanaBTC[0].receiveStringAmount);
const provider = getCompanyNameFromList(swapQuotesSolanaBTC[0].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const formattedReceiveAmount = `${receiveAmount} BTC`;
const { sendAddress } = swapTradeSolanaBTC;
const formattedSendAddress = formatAddressWithNewlines(sendAddress);

test.describe('Trading - Swap coins', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesSolanaBTC });
                });
                await tradingMock.routeSwapTrade(swapTradeSolanaBTC);
                await tradingMock.routeSolanaSendRequests();
                await tradingMock.routeDummyProviderSupportPage();
                await page.route(invityEndpoint.swapWatch, async route => {
                    await route.fulfill({ json: { status: 'SENDING', sendAddress } });
                });
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana to Bitcoin', async ({
        device,
        tradingPage,
        page,
        tradingMock,
        devicePrompt,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    searchFilter: 'Solana #1',
                    networkSymbol: 'sol',
                },
                buyAsset: {
                    searchFilter: 'Bitcoin',
                    assetCryptoId: getCryptoId('btc'),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
        });

        const solanaFee = (await tradingPage.fees.getSolanaFee()).toString();

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Initiate send', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
            await expect(devicePrompt.headerParagraph).toContainText('Solana #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            const transformedExpectedAddress = transformAddress(sendAddress, 'fullLine');
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Recipient' },
                    body: [transformedExpectedAddress],
                    actions: { right_button: 'Continue' },
                },
            });

            await devicePrompt.waitForPromptAndConfirm();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                formattedSendAmount,
            );
            // Temporary debug information to solve issue that is happening only on CI.
            // Suite probably fails to simulate fees and use fallback. That is correct behaviour.
            // We are trying to find out whether there is something in redux state that could help us detect such situation.
            // Goal would be to detect such a state and adjust expected fee to fallback value.
            const debugFeeInfo = JSON.stringify(
                await page.getReduxObject('wallet.trading.composedTransactionInfo'),
                null,
                2,
            );
            const verboseErrorMessage =
                'Fee displayed on the device does not match expected fee from form. Redux transaction info: ' +
                debugFeeInfo;
            await expect(devicePrompt.cryptoAmountOf('fee'), verboseErrorMessage).toHaveText(
                solanaFee,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Amount:'],
                        [formattedSendAmount],
                        ['Transaction fee'],
                        device.wrapText(`${solanaFee} SOL`, { wrapByWords: true }),
                    ],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });

            await devicePrompt.waitForFinalPromptAndConfirm();
        });
        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await expect(page.getByTestId('@toast/tx-exchange/send-account')).toContainText(
                'Solana #1',
            );
            await expect(page.getByTestId('@toast/tx-exchange/receive-account')).toContainText(
                'Bitcoin #1',
            );
            await expect(page.getByTestId('@toast/tx-exchange/send-amount')).toContainText(
                sendAmount,
            );
            await expect(page.getByTestId('@toast/tx-exchange/receive-amount')).toContainText(
                receiveAmount,
            );
        });

        for (const { transactionStatus, displayedText, translationValues } of transactionStates) {
            await test.step(`Wait 30s for status change to ${displayedText}`, async () => {
                await tradingMock.routeAndWaitForWatchResponse(invityEndpoint.swapWatch, {
                    status: transactionStatus,
                    sendAddress,
                });
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    displayedText as TranslationKey,
                    translationValues ? { values: translationValues(provider) } : undefined,
                );
            });

            // Support banner is only visible when status is CONVERTING, check it right after CONVERTING status is reached
            if (transactionStatus === 'CONVERTING') {
                await test.step('Verify button opens provider support page in new tab', async () => {
                    const supportLink = page.locator('a[href*="mocked.partner.site"]');
                    // eslint-disable-next-line playwright/no-conditional-expect
                    await expect(supportLink).toBeVisible({ timeout: 10000 });
                    const partnerPagePromise = page.context().waitForEvent('page');
                    await supportLink.click();
                    const partnerTab = await partnerPagePromise;
                    // Mocked data have URL changed to https://mocked.partner.site/orders/{{orderId}} for stability reasons
                    // eslint-disable-next-line playwright/no-conditional-expect
                    await expect(partnerTab).toHaveURL(/https:\/\/mocked\.partner\.site\/orders\//);
                    await partnerTab.close();
                });
            }
        }

        await test.step('Verify all transaction values', async () => {
            await expect(tradingPage.confirmation.cryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmation.cryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmation.exchangeType).toHaveTranslation(
                'TR_EXCHANGE_FLOAT',
            );
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
        });
    });
});
