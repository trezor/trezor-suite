import { TranslationKey } from '@suite/intl';
import { toChecksumAddress } from '@suite-common/address';
import { getCryptoId } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import { getCompanyNameFromList } from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '0.03';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const accountLabel = 'Ethereum #1';

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

test.describe('Trading POC - passthru swap ETH', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
            passthruTradingMock,
        }) => {
            // ETH broadcasts go over the Blockbook websocket, so the blocking passthrough
            // proxy must be set as a custom backend before discovery starts.
            const ethBackendUrl = await passthruTradingMock.blockEthSends();

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [
                    'btc',
                    { symbol: 'eth', backend: { type: 'blockbook', url: ethBackendUrl } },
                ],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'eth' });
        },
    );

    test('Swap ETH to BTC with live quotes and blocked send', async ({
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
                    networkSymbol: 'eth',
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
            await tradingPage.swapBestOfferButton.click();
            await page.expectReduxObjectNotToBeEmpty('wallet.trading.composedTransactionInfo', {
                timeout: 15_000,
            });
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
                    header: { title: 'Send' },
                    body: [transformAddress(toChecksumAddress(sendAddress), 'evmTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
            // ETH's send review shows the fee on the modal; the amount is verified on the device.
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);

            // Fee is live, so read the displayed maximum fee and expect the device to echo it.
            const maximumFee = (
                await devicePrompt.cryptoAmountWithSymbolOf('fee').innerText()
            ).trim();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Amount'],
                        [formattedSendAmount],
                        ['Maximum fee'],
                        device.wrapText(maximumFee, { isAmount: true }),
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
            // Hard gate: live traffic must have flowed through the blocking proxy already.
            expect(passthruTradingMock.passthroughCount).toBeGreaterThan(0);

            await passthruTradingMock.routeSwapWatch('SENDING');
            await page.clock.install();
            await devicePrompt.sendButton.click();

            await expect.poll(() => passthruTradingMock.blockedSendCount).toBeGreaterThan(0);

            await tradingPage.verifySwapToast({
                sendAccount: accountLabel,
                receiveAccount: 'Bitcoin #1',
                sendAmount,
                receiveAmount,
            });
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
