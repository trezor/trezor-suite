import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { invityEndpoint, swapQuotesEthereumBTC, swapTradeEthereumBTC } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const sendAmount = '0.008';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const gasLimit = '26000';
const maxFeePerGas = '2.67674454';
const maxFeePerGasRounded = new BigNumber(maxFeePerGas).decimalPlaces(2, BigNumber.ROUND_UP);
const maxPriorityFeePerGas = '1.375641927';
const maxPriorityFeePerGasRounded = new BigNumber(maxPriorityFeePerGas).decimalPlaces(
    2,
    BigNumber.ROUND_UP,
);

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

    test('Swap custom fees for Ethereum', async ({
        tradingPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fees.switchModeButton('custom').click();
            await tradingPage.fees.ethereumFeeLimit.fill(gasLimit);
            await tradingPage.fees.ethereumMaxFeePerGas.fill(maxFeePerGas);
            await tradingPage.fees.ethereumMaxPriorityFeePerGas.fill(maxPriorityFeePerGas);
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: 'ethereum',
                sendTicker: 'ETH',
                receiveCurrency: 'Bitcoin',
                receiveSymbol: 'btc',
                receiveNetwork: 'bitcoin',
            });
        });

        await test.step('Continue Swap flow towards Send section', async () => {
            await tradingPage.swapBestOfferButton.click();
            await tradingPage.confirmTrade('Bitcoin #1');
            await tradingPage.finishTransactionButton.click();
            await tradingPage.openConfirmAndSendModal();
            await expect(devicePrompt.headerParagraph).toContainText('Ethereum #1');
            await devicePrompt.waitForPromptAndClick();
        });

        const { ethereumMaximumFee, errorMessageMaxCalculation } =
            await tradingPage.fees.calculateEthereumMaxFee({
                gasLimit,
                maxFeePerGas,
            });

        await test.step('Verify fees on modal and emulator', async () => {
            await expect(devicePrompt.ethereumGasLimit).toHaveText(`Gas limit: ${gasLimit}`);
            await expect(devicePrompt.ethereumFeeRate).toHaveText(`${maxFeePerGasRounded} Gwei`);
            // TODO: Investigate why this fee value is displayed only in CI run
            if (process.env.GITHUB_ACTION) {
                await expect(devicePrompt.ethereumPriorityFeeRate).toHaveText(
                    `${maxPriorityFeePerGasRounded} Gwei`,
                );
            }
            await expect(
                devicePrompt.cryptoAmountWithSymbolOf('fee'),
                errorMessageMaxCalculation,
            ).toHaveText(`${ethereumMaximumFee} ETH`);
            await expect(devicePrompt).toDisplayEthereumSummary(
                formattedSendAmount,
                `${ethereumMaximumFee} ETH`,
            );
        });

        await test.step('Verify Fee Info on emulator', async () => {
            const burgerMenuCoordinates = { x: 200, y: 20 };
            await trezorUserEnvLink.clickEmu(burgerMenuCoordinates);
            const feeInfoCoordinates = { x: 125, y: 100 };
            await trezorUserEnvLink.clickEmu(feeInfoCoordinates);
            await expect(devicePrompt).toDisplayEthereumFeeInfo(
                `${gasLimit} units`,
                `${maxFeePerGas} Gwei`,
                `${maxPriorityFeePerGas} Gwei`,
            );
        });
    });
});
