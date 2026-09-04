import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines, isWebProject } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const solSymbol = asNetworkSymbol('sol');
const btcSymbol = asNetworkSymbol('btc');

const sendAmount = '0.5';
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const accountLabel = 'Solana #1';

test.describe('Trading - Swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            await tradingMockNew.mockProviderStatusPage();
            const solBackend = await tradingMockNew.startBackend(solSymbol);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [btcSymbol, { symbol: solSymbol, backend: solBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: solSymbol });
        },
    );

    test('Swap SOL to BTC', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        tradingMockNew,
        tradingResponses,
        target,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    searchFilter: accountLabel,
                    networkSymbol: solSymbol,
                },
                buyAsset: {
                    searchFilter: 'Bitcoin',
                    assetCryptoId: getCryptoId(btcSymbol),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, btcSymbol);
                },
            });
        });

        let receiveAmount: string;
        let providerName: string;
        let solanaFee: string;

        await test.step('Confirm the Swap trade', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            await tradingPage.fees.waitToBeCalculated();
            solanaFee = (await tradingPage.fees.getSolanaFee()).toString();
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Open modal and verify recipient on prompt and device', async () => {
            const { exchange, sendAddress } = await tradingResponses.swap.trade();
            providerName = await tradingResponses.swap.companyName(exchange);

            await tradingPage.confirmation.openConfirmAndSendModal();

            await expect(devicePrompt.header.accountLabel).toHaveText(accountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(sendAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Recipient' },
                    body: [transformAddress(sendAddress, 'fourTetragrams')],
                    actions: { right_button: 'Continue' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
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
            await devicePrompt.waitForFinalPromptAndConfirm();
            await expect(devicePrompt.sendButton).toBeEnabled();
        });

        await test.step('Send crypto to provider (broadcast blocked by mock)', async () => {
            await tradingMockNew.setStatus('SENDING');
            await page.clock.install();
            await devicePrompt.sendButton.click();

            const { sendStringAmount } = await tradingResponses.swap.trade();

            await tradingPage.verifySwapToast({
                sendAccount: accountLabel,
                receiveAccount: 'Bitcoin #1',
                // The toast echoes the provider's formatting of the amount, not the one we typed.
                sendAmount: sendStringAmount,
                receiveAmount,
            });
        });

        for (const phase of swapStatusFlow) {
            await test.step(`Wait for status change to ${phase.status}`, async () => {
                await tradingMockNew.advanceStatus(phase.status);
                const values = phase.translationValues?.(providerName);
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    phase.translationKey,
                    { values },
                );
            });

            if (phase.status === 'CONVERTING' && isWebProject(target)) {
                await test.step('Support banner link opens the mocked provider page', async () => {
                    const statusLink = page.locator('a[href*="mocked.partner.site"]');
                    // eslint-disable-next-line playwright/no-conditional-expect
                    await expect(statusLink).toBeVisible({ timeout: 10_000 });
                    const providerPagePromise = page.context().waitForEvent('page');
                    await statusLink.click();
                    const providerTab = await providerPagePromise;
                    // eslint-disable-next-line playwright/no-conditional-expect
                    await expect(providerTab).toHaveURL(/mocked\.partner\.site\/orders\//);
                    await providerTab.close();
                });
            }
        }

        await test.step('Verify transaction detail values', async () => {
            await expect(tradingPage.confirmation.sendCryptoAmount).toHaveText(formattedSendAmount);
            await expect(tradingPage.confirmation.receiveCryptoAmount).toHaveText(
                `${receiveAmount} BTC`,
            );
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });
    });
});
