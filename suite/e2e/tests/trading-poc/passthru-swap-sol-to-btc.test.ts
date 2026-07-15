import { TranslationKey } from '@suite/intl';
import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import { getCompanyNameFromList } from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '0.5';
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const accountLabel = 'Solana #1';

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

test.describe('Trading POC - passthru swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
            passthruTradingMock,
        }) => {
            // Solana broadcasts go through the blockchain-link worker, so the blocking
            // passthrough backend must be set as a custom backend before discovery starts.
            const solBackendUrl = await passthruTradingMock.blockSolanaSends();

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
            await settingsPage.enableNetworkWithCustomBackend('sol', 'solana', solBackendUrl);
            await dashboardPage.navigateTo();
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap SOL to BTC with live quotes and blocked send', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        passthruTradingMock,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    searchFilter: accountLabel,
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

        let receiveAmount: string;
        let providerName: string;
        // The live trade (real deposit address) is created when the best offer is confirmed,
        // so arm the listener before that click to avoid racing the request.
        let liveTradePromise: ReturnType<typeof passthruTradingMock.waitForLiveTrade>;

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(/^\d+(\.\d+)?\s+BTC$/);
            const [amount] = (await tradingPage.quotes.bestOfferAmount.innerText()).split(' ');
            receiveAmount = localizeNumber(amount ?? '');
            liveTradePromise = passthruTradingMock.waitForLiveTrade();
            await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
        });

        await test.step('Open modal and verify recipient on prompt and device', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
            const liveTrade = await liveTradePromise;
            providerName = getCompanyNameFromList(liveTrade.exchange ?? '', 'swapList');
            const sendAddress = passthruTradingMock.liveTradeSendAddress;

            await expect(devicePrompt.headerParagraph).toContainText(accountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(sendAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Recipient' },
                    body: [transformAddress(sendAddress, 'fullLine')],
                    actions: { right_button: 'Continue' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                formattedSendAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);

            // Fee is live, so read the displayed fee and expect the device to echo it.
            const solanaFee = (await devicePrompt.cryptoAmountOf('fee').innerText()).trim();
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
            await expect(devicePrompt.sendButton).toBeEnabled();
        });

        await test.step('Send crypto to provider (broadcast blocked by mock)', async () => {
            // Hard gate: live traffic must have flowed through the blocking route already.
            expect(passthruTradingMock.passthroughCount).toBeGreaterThan(0);

            await passthruTradingMock.routeSwapWatch('SENDING');
            await page.clock.install();
            await devicePrompt.sendButton.click();

            await expect.poll(() => passthruTradingMock.blockedSendCount).toBeGreaterThan(0);

            await expect(tradingPage.swapToastSendAccount).toContainText(accountLabel);
            await expect(tradingPage.swapToastReceiveAccount).toContainText('Bitcoin #1');
            await expect(tradingPage.swapToastSendAmount).toContainText(sendAmount);
            await expect(tradingPage.swapToastReceiveAmount).toContainText(receiveAmount);
        });

        for (const { transactionStatus, displayedText, translationValues } of transactionStates) {
            await test.step(`Wait for status change to ${displayedText}`, async () => {
                await passthruTradingMock.advanceToWatchStatus(transactionStatus);
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    displayedText as TranslationKey,
                    translationValues ? { values: translationValues(providerName) } : undefined,
                );
            });
        }

        await test.step('Verify transaction detail values', async () => {
            await expect(tradingPage.confirmation.cryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmation.cryptoAmount.last()).toHaveText(
                `${receiveAmount} BTC`,
            );
            await expect(tradingPage.confirmation.provider).toBeVisible();
        });
    });
});
