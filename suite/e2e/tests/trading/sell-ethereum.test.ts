import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { sellStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '0.02';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const accountLabel = 'Ethereum #1';

// Typed rather than left to the live fee estimate, so every fee assertion stays exact.
const gasLimit = '26000';
const maxFeePerGas = '2.67674454';
const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(4, BigNumber.ROUND_UP);
const maxPriorityFeePerGas = '1.375641927';
const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
    4,
    BigNumber.ROUND_UP,
);

// Live Invity never hands out a deposit address for a payment its provider page never initiated,
// so the test supplies one. It is an address of this same wallet: the broadcast is already blocked
// by the backend, and a self-owned address means even a regression there could not move funds out.
const depositAddress = '0xF93b32f856d44B7E4AcFa209862f43b8f49bAb67';

test.describe('Trading - Sell ETH', { tag: ['@T3W1', '@T3T1'] }, () => {
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
            const ethBackend = await tradingMockNew.startBackend('eth');

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: 'eth', backend: ethBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openTrading({ symbol: 'eth' });
            await tradingPage.sellTabButton.click();
        },
    );

    test('Sell Ethereum for best offer', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        tradingMockNew,
        tradingResponses,
    }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm({
                cryptoAmount: sendAmount,
                networkSymbolOrTokenId: 'eth',
            });
            await tradingPage.fees.setEthereumCustomFees({
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
            });
            await tradingPage.fees.waitToBeCalculated();
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
            // Providers pad differently ("0.02000000"), so both amounts are normalised the way
            // the panel formats them rather than compared to the raw strings. The panel always
            // renders the fiat amount with two decimals, including a trailing zero.
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(
                `${localizeNumber(cryptoStringAmount)} ETH`,
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
                    body: [transformAddress(depositAddress, 'evmTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient' },
                    body: [transformAddress(depositAddress, 'evmTetragrams')],
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        const { ethereumMaximumFee, errorMessageMaxCalculation } =
            tradingPage.fees.calculateEthereumMaxFee({ gasLimit, maxFeePerGas });

        await test.step('Verify amount and fee on prompt and device', async () => {
            await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
            await expect(devicePrompt.header.feePerGasValue).toHaveText(`${maxFeePerGasRounded}`);
            await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                `${maxPriorityFeePerGasRounded}`,
            );
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedSendAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee'), errorMessageMaxCalculation).toHaveText(
                ethereumMaximumFee,
            );

            const maxFeeWrapped = device.wrapText(`${ethereumMaximumFee} ETH`, { isAmount: true });
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], [formattedSendAmount], ['Maximum fee'], maxFeeWrapped],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                    body: [['Amount'], [formattedSendAmount], ['Maximum fee'], maxFeeWrapped],
                },
            });
        });

        await test.step('Verify fee info on device', async () => {
            await device.openFeeInfo();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Fee info' },
                    body: [
                        ['Gas limit'],
                        [`${gasLimit} units`],
                        ['Max fee per gas'],
                        [`${maxFeePerGas} Gwei`],
                        ['Max priority fee'],
                        [`${maxPriorityFeePerGas} Gwei`],
                    ],
                },
                T3T1: {
                    footer: undefined,
                },
            });
        });

        await test.step('Sign the transaction', async () => {
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
