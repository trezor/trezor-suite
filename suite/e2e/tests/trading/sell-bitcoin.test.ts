import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { sellStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '0.0015';
const formattedSendAmount = `${localizeNumber(sendAmount)} BTC`;
const accountLabel = 'Bitcoin #1';

// Live Invity never hands out a deposit address for a payment its provider page never initiated,
// so the test supplies one. It is an address of this same wallet: the broadcast is already blocked
// by the backend, and a self-owned address means even a regression there could not move funds out.
const depositAddress = 'bc1qftjj5a3s8emtxhexlgpne5d7zp26qsjfxhhgfu';
const depositPaymentExtraId = '6d666a5f-b99c-4482-b8bc-2df04fc11b7b';

test.describe('Trading - Sell BTC', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
            tradingPage,
            tradingMockNew,
        }) => {
            tradingMockNew.setTradeFlow('sell');
            await tradingMockNew.rewriteProviderRedirect();
            await tradingMockNew.setWatchFields({
                destinationAddress: depositAddress,
                destinationPaymentExtraId: depositPaymentExtraId,
            });
            await tradingMockNew.setStatus('SEND_CRYPTO');
            const btcBackend = await tradingMockNew.startBackend('btc');

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: 'btc', backend: btcBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openTrading({ symbol: 'btc' });
            await tradingPage.sellTabButton.click();
        },
    );

    test('Sell Bitcoin for best offer', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        tradingMockNew,
        tradingResponses,
    }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm({ cryptoAmount: sendAmount });
            await tradingPage.fees.expectBitcoinFeeCalculated();
        });

        let providerName: string;

        await test.step('Confirm the sell trade and return from the provider', async () => {
            await tradingPage.sellBestOfferButton.click();
            await tradingPage.waitForRedirectCompletion();
        });

        await test.step('Verify all confirmation values', async () => {
            const { exchange, cryptoStringAmount, fiatStringAmount } =
                await tradingResponses.sell.trade();
            providerName = await tradingResponses.sell.companyName(exchange);

            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
            await expect(tradingPage.confirmation.paymentMethod).toHaveTranslation(
                'TR_PAYMENT_METHOD_CREDITCARD',
            );
            await expect(tradingPage.confirmation.account).toContainText(accountLabel);
            await expect(tradingPage.confirmation.address).toHaveText(depositAddress);
            await expect(tradingPage.confirmation.paymentId).toHaveText(depositPaymentExtraId);
            // Providers pad differently ("0.00150000"), so both amounts are normalised the way
            // the panel formats them rather than compared to the raw strings.
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(
                `${localizeNumber(cryptoStringAmount)} BTC`,
            );
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(
                `€${localizeNumber(fiatStringAmount, 'en-US', 2, 2)}`,
            );
        });

        await test.step('Verify recipient on prompt and device', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();

            await expect(devicePrompt.header.accountLabel).toHaveText(accountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(depositAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [transformAddress(depositAddress, 'fourTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient #1' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedSendAmount,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], [formattedSendAmount]],
                    actions: { right_button: 'Confirm' },
                },
                T3T1: {
                    header: { title: 'Amount', subtitle: 'Recipient #1' },
                    body: [[formattedSendAmount]],
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify total and fee on prompt and device', async () => {
            // The BTC fee is live; derive the total from it and crosscheck modal against device.
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveText(/\d/);
            const reviewFee = await devicePrompt.cryptoAmountOf('fee').innerText();
            const totalAmount = new BigNumber(reviewFee).plus(sendAmount).toString();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                `${totalAmount} BTC`,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Total amount'],
                        [`${totalAmount} BTC`],
                        ['incl. Transaction fee'],
                        [`${reviewFee} BTC`],
                    ],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
            await expect(devicePrompt.sendButton).toBeEnabled();
        });

        await test.step('Send crypto to provider (broadcast blocked by mock)', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();

            await expect(tradingPage.transactionDetailHeader).toHaveTranslation(
                'TR_SELL_HEADER_TITLE',
            );
        });

        for (const phase of sellStatusFlow) {
            await test.step(`Wait for status change to ${phase.status}`, async () => {
                await tradingMockNew.advanceStatus(phase.status);
                const values = phase.translationValues?.(providerName);
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    phase.translationKey,
                    { values },
                );
            });
        }
    });
});
