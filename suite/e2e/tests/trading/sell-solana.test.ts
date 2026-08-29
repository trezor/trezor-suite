import { localizeNumber } from '@suite-common/wallet-utils';
import { TestStream } from '@trezor/e2e-utils';

import { sellStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '1.5';
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const accountLabel = 'Solana #1';

// Live Invity never hands out a deposit address for a payment its provider page never initiated,
// so the test supplies one. It is an address of this same wallet: the broadcast is already blocked
// by the backend, and a self-owned address means even a regression there could not move funds out.
const depositAddress = 'ENk2eeP4umP6cjAGRsVG4NEVKEVQmRn6JEpN8hubv2Hf';

test.describe('Trading - Sell Solana', { tag: ['@T3W1', '@T3T1'] }, () => {
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
            await tradingMockNew.setWatchFields({ destinationAddress: depositAddress });
            await tradingMockNew.setStatus('SEND_CRYPTO');
            const solBackend = await tradingMockNew.startBackend('sol');

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: 'sol', backend: solBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openTrading({ symbol: 'sol' });
            await tradingPage.sellTabButton.click();
        },
    );

    test(
        'Sell Solana for best offer',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({
            tradingPage,
            page,
            device,
            devicePrompt,
            tradingMockNew,
            toastSection,
            tradingResponses,
        }) => {
            let solanaFee: string;

            await test.step('Fill in a sell request', async () => {
                await tradingPage.fillSellForm({
                    cryptoAmount: sendAmount,
                    networkSymbolOrTokenId: 'sol',
                });
                await tradingPage.fees.waitToBeCalculated();
                await expect(tradingPage.fees.maxFee).toBeVisible();
                await expect(tradingPage.fees.maxFeeFiat).toBeVisible();
                // The form is the only place the fee is readable before signing; the review modal
                // and the device are then held against it.
                solanaFee = (await tradingPage.fees.getSolanaFee()).toString();
            });

            let providerName: string;

            await test.step('Confirm the sell trade and return from the provider', async () => {
                // Solana fees resolve after the form settles; sending before that fails to compose.
                await expect(tradingPage.fees.maximumFeeAmountToBeCalculated).toBeHidden();
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
                // Providers pad differently ("1.50000000"), so both amounts are normalised the way
                // the panel formats them rather than compared to the raw strings. The panel always
                // renders the fiat amount with two decimals, including a trailing zero.
                await expect(tradingPage.confirmation.cryptoAmount).toHaveText(
                    `${localizeNumber(cryptoStringAmount)} SOL`,
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
                        header: { title: 'Recipient' },
                        body: [transformAddress(depositAddress, 'fourTetragrams')],
                        actions: { right_button: 'Continue' },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify amount and fee on prompt and device', async () => {
                // Solana keeps the fee out of the total, so the total is the amount on its own.
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    formattedSendAmount,
                );
                await expect(devicePrompt.cryptoAmountOf('fee')).toHaveText(solanaFee);
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [
                            ['Amount'],
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
                await devicePrompt.waitForPromptAndConfirm();
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(devicePrompt.sendButton).toBeEnabled();
            });

            await test.step('Send crypto to provider (broadcast blocked by mock)', async () => {
                await page.clock.install();
                await devicePrompt.sendButton.click();

                await expect(tradingPage.transactionDetailHeader).toHaveTranslation(
                    'TR_SELL_HEADER_TITLE',
                );
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    'TR_TRADING_DETAIL_SENDING_TRANSACTION',
                );
                // Unlike the swap toast, this one carries the composed amount rather than the
                // provider's own formatting of it, so it matches the amount the test typed.
                await expect(toastSection.txSent).toContainTranslation('TOAST_TX_SENT', {
                    values: { amount: formattedSendAmount, account: accountLabel },
                });
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

            await test.step('Verify the trade summary in the sidebar', async () => {
                const { cryptoStringAmount, fiatStringAmount } =
                    await tradingResponses.sell.trade();

                await expect(tradingPage.transactionDetailSidebar.sendAmount).toHaveText(
                    `${localizeNumber(cryptoStringAmount)} SOL`,
                );
                // The sidebar prints the fiat amount without a symbol and drops a trailing zero,
                // unlike the confirmation panel's fixed two decimals.
                await expect(tradingPage.transactionDetailSidebar.fiatAmount).toHaveText(
                    localizeNumber(fiatStringAmount, 'en-US', 0, 2),
                );
                await expect(tradingPage.transactionDetailSidebar.provider).toHaveText(
                    providerName,
                );
            });

            await test.step('Verify the support banner links to the winning provider', async () => {
                const { exchange } = await tradingResponses.sell.trade();
                // Which provider wins drifts between runs, and the banner links to that provider's
                // own support site. Banxa points both its status and support link at the same URL.
                const { supportUrl } = await tradingResponses.sell.provider(exchange);
                await expect(page.locator(`a[href="${supportUrl}"]`).first()).toBeVisible();
            });
        },
    );

    test(
        'Sell Solana for compared offer',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ tradingPage, tradingResponses }) => {
            await test.step('Fill in a sell request', async () => {
                await tradingPage.fillSellForm({
                    cryptoAmount: sendAmount,
                    networkSymbolOrTokenId: 'sol',
                });
                await tradingPage.fees.waitToBeCalculated();
            });

            let comparedProviderName: string;

            await test.step('Pick an offer other than the best one', async () => {
                await tradingPage.quotes.chooseDifferentOfferIfAvailable();
                comparedProviderName = (
                    await tradingPage.quotes.selectedProviderName.innerText()
                ).trim();
            });

            await test.step('Verify the trade is created with the picked provider', async () => {
                await tradingPage.sellBestOfferButton.click();
                await tradingPage.waitForRedirectCompletion();

                const { exchange } = await tradingResponses.sell.trade();
                expect(await tradingResponses.sell.companyName(exchange)).toBe(
                    comparedProviderName,
                );
                await expect(tradingPage.confirmation.provider).toHaveText(comparedProviderName);
            });
        },
    );
});
