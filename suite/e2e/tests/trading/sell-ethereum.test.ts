import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    sellQuotesEthereum,
    sellTradeEthereum,
    sellWatchEthereum,
    tradeEndpoint,
} from '../../fixtures/trading';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesEthereum[0]?.fiatStringAmount ?? '';
const cryptoAmount = sellQuotesEthereum[0]?.cryptoStringAmount ?? '';
const provider = getCompanyNameFromList(sellQuotesEthereum[0]?.exchange ?? '', 'sellList');
const providerAddress = sellWatchEthereum.destinationAddress;
const formattedCryptoAmount = `${cryptoAmount} ETH`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeEthereum.trade;
const formattedAddress = formatAddressWithNewlines(sellWatchEthereum.destinationAddress);
// Fees
const gasLimit = '26000';
const maxFeePerGas = '2.67674454';
const maxPriorityFeePerGas = '1.375641927';
/*TODO: Uncomment once bug #19186 is resolved 
+ import BigNumber from '@trezor/utils' and localizeNumber from '@suite-common/wallet-utils'
const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(2, BigNumber.ROUND_UP);
const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
    2,
    BigNumber.ROUND_UP,
);
*/

test.describe('Trading - Sell Ethereum', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });

    test.beforeEach(
        async ({
            page,
            tradingMock,
            tradingPage,
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
        }) => {
            await test.step('Mocking responses', async () => {
                await page.route(tradeEndpoint.sellQuotes, async route => {
                    await route.fulfill({ json: sellQuotesEthereum });
                });
                await tradingMock.routeTrade(tradeEndpoint.sellTrade, sellTradeEthereum);
                await page.route(tradeEndpoint.sellWatch, async route => {
                    await route.fulfill({ json: sellWatchEthereum });
                });
            });

            await onboardingPage.completeOnboarding();

            await test.step('Enable Ethereum and open its token sell trading', async () => {
                await settingsPage.changeNetworks({ enableNetworks: ['eth'] });
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openTrading({ symbol: 'eth' });
                await tradingPage.sellTabButton.click();
            });
        },
    );

    test('Sell Ethereum', async ({ tradingPage, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm({
                cryptoAmount,
                networkSymbolOrTokenId: 'eth',
            });
            await tradingPage.fees.setEthereumCustomFees({
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quotes.provider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await tradingPage.sellBestOfferButton.click();
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
            await expect(tradingPage.confirmation.paymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.confirmation.address).toHaveText(providerAddress);
            await expect(tradingPage.confirmation.account).toHaveText('Ethereum #1');
        });

        await test.step('Initiate send', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
            await expect(devicePrompt.header.accountLabel).toHaveText('Ethereum #1');
            await devicePrompt.waitForPromptAndClick();
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedAddress);
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedCryptoAmount,
            );
        });

        /*TODO: Uncomment once bug #19186 is resolved
        const { ethereumMaximumFee, errorMessageMaxCalculation } =
            tradingPage.fees.calculateEthereumMaxFee({
                gasLimit,
                maxFeePerGas,
            });

        await test.step('Verify fees on modal and emulator', async () => {
            await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
            await expect(devicePrompt.header.feePerGasValue).toHaveText(`${maxFeePerGasRounded}`);
            await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                `${maxPriorityFeePerGasRounded}`,
            );
            await expect(device).toDisplayOnEmulator({
                T3W1: {
                    header: { title: 'Summary' },
                    body: [
                        ['Amount'],
                        [formattedCryptoAmount],
                        ['Maximum fee'],
                        device.wrapText(`${ethereumMaximumFee} ETH`, { isAmount: true }),
                    ],

                    actions: { right_button: 'Confirm' }, 
                },
            });
           
            await expect(
                devicePrompt.cryptoAmountWithSymbolOf('fee'),
                errorMessageMaxCalculation,
            ).toHaveText(`${ethereumMaximumFee} ETH`);
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await devicePrompt.openFeeInfoOnEmulator();
            await expect(device).toDisplayOnEmulator({
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
                    actions: { right_button: 'Confirm' },
                },
            });
        });
        */

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
