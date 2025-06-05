import { BigNumber } from '@trezor/utils';

import { invityEndpoint, swapQuotesBTCEthereum, swapTradeBTCEthereum } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const sendAmount = '0.0004';
const customFee = '10';

test.describe('Trading - Swap fees Bitcoin', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ onboardingPage, dashboardPage, walletPage, settingsPage, page, tradingMock }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesBTCEthereum });
                });
                await tradingMock.routeSwapTrade(swapTradeBTCEthereum);
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['eth'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'btc' });
        },
    );

    test('Swap custom fees for Bitcoin', async ({ tradingPage, devicePrompt }) => {
        let feeRate: string;
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fees.switchModeButton('custom').click();
            await tradingPage.fees.customInput.fill(customFee);
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: 'bitcoin',
                sendTicker: 'BTC',
                receiveCurrency: 'Ethereum',
                receiveSymbol: 'eth',
                receiveNetwork: 'ethereum',
            });
            feeRate = await tradingPage.fees.getBitcoinFeeRate('custom');
        });

        await test.step('Continue Swap flow towards Send section', async () => {
            await tradingPage.swapBestOfferButton.click();
            await tradingPage.confirmTrade('Ethereum #1');
            await tradingPage.finishTransactionButton.click();
            await tradingPage.openConfirmAndSendModal();
            await expect(devicePrompt.headerParagraph).toContainText('Bitcoin #1');
            await devicePrompt.waitForPromptAndClick();
            await devicePrompt.waitForPromptAndClick();
        });

        await test.step('Verify fees on modal and emulator', async () => {
            const feeFromDeviceModal = await devicePrompt.cryptoAmountOf('fee').textContent();
            if (!feeFromDeviceModal) {
                throw new Error('"Including fee" is not displayed on the device prompt modal');
            }
            const totalAmount = new BigNumber(feeFromDeviceModal).plus(sendAmount).toString();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                `${totalAmount} BTC`,
            );
            await expect(devicePrompt.headerFeeRate).toContainText(feeRate);
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Summary' },
                body: [
                    ['Total amount'],
                    [`${totalAmount} BTC`],
                    [' '],
                    ['incl. Transaction fee'],
                    [`${feeFromDeviceModal} BTC`],
                ],
                footer: 'Tap to continue',
            });
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await tradingPage.fees.openFeeInfoOnEmulator();
            const feeRateWithoutDecimals = feeRate.replace('.00\u00A0', ' ');
            await expect(devicePrompt).toDisplayOnEmulator({
                header: { title: 'Fee info' },
                body: [['Fee rate'], [feeRateWithoutDecimals]],
            });
        });
    });
});
