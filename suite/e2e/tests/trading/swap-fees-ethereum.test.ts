import { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { invityEndpoint, swapQuotesEthereumBTC, swapTradeEthereumBTC } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';
import { splitStringByDisplayLimit } from '../../support/testExtends/customMatchers';

const sendAmount = '0.008';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const gasLimit = '26000';
const maxFeePerGas = '2.67674454';
const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(4, BigNumber.ROUND_UP);
const maxPriorityFeePerGas = '1.375641927';
const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
    4,
    BigNumber.ROUND_UP,
);
const { receiveAddress } = swapTradeEthereumBTC;

test.describe('Trading - Swap fees', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ onboardingPage, dashboardPage, walletPage, settingsPage, tradingMock, page }) => {
            await test.step('Mocking responses', async () => {
                await tradingMock.routeInvityGeneralEndpoints();
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesEthereumBTC });
                });
                await tradingMock.routeSwapTrade(swapTradeEthereumBTC);
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['eth'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'eth' });
        },
    );

    test('Swap custom fees for Ethereum', async ({ page, tradingPage, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: 'ethereum',
                sendTicker: 'ETH',
                receiveAsset: {
                    searchFilter: 'Bitcoin',
                    networkFilter: 'btc',
                    receiveAsset: 'bitcoin' as CryptoId,
                },
                receiveNetwork: 'bitcoin',
                receiveAddress,
            });
            await tradingPage.fees.setEthereumCustomFees({
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
            });

            // Wait for TX precomposition to avoid
            await new Promise(resolve => setTimeout(resolve, 2500));
        });

        await test.step('Continue Swap flow towards Send section', async () => {
            await tradingPage.swapBestOfferButton.click();
            await page.expectReduxObjectNotToBeEmpty('wallet.trading.composedTransactionInfo');
            await tradingPage.openConfirmAndSendModal();
            await expect(devicePrompt.headerParagraph).toContainText('Ethereum #1');
            await devicePrompt.waitForPromptAndClick();
        });

        const { ethereumMaximumFee, errorMessageMaxCalculation } =
            tradingPage.fees.calculateEthereumMaxFee({
                gasLimit,
                maxFeePerGas,
            });

        await test.step('Verify fees on modal and emulator', async () => {
            await expect(devicePrompt.ethereumGasLimit).toHaveText(`Gas limit: ${gasLimit}`);
            await expect(devicePrompt.ethereumFeeRate).toHaveText(`${maxFeePerGasRounded} Gwei`);
            await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                `${maxPriorityFeePerGasRounded} Gwei`,
            );
            await expect(
                devicePrompt.cryptoAmountWithSymbolOf('fee'),
                errorMessageMaxCalculation,
            ).toHaveText(`${ethereumMaximumFee} ETH`);
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Summary' },
                body: [
                    ['Amount'],
                    [formattedSendAmount],
                    [' '],
                    ['Maximum fee'],
                    splitStringByDisplayLimit(`${ethereumMaximumFee} ETH`),
                ],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await tradingPage.fees.openFeeInfoOnEmulator();
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Fee info' },
                body: [
                    ['Gas limit'],
                    [`${gasLimit} units`],
                    [' '],
                    ['Max fee per gas'],
                    [`${maxFeePerGas} Gwei`],
                    [' '],
                    ['Max priority fee'],
                    [`${maxPriorityFeePerGas} Gwei`],
                ],
            });
        });
    });
});
