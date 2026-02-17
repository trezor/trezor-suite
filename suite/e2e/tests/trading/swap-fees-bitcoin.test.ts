import { BigNumber } from '@trezor/utils';

import { invityEndpoint, swapQuotesBTCEthereum, swapTradeBTCEthereum } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const sendAmount = '0.0004';
const customFee = '10';

test.describe('Trading - Swap fees Bitcoin', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
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

    test('Swap custom fees for Bitcoin', async ({ page, device, tradingPage, devicePrompt }) => {
        let feeRate: string;
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    networkFilter: 'btc',
                    networkSymbol: 'btc',
                },
                buyAsset: {
                    searchFilter: 'Ethereum',
                    networkFilter: 'eth',
                    networkSymbol: 'eth',
                },
            });
            await tradingPage.fees.switchToCustom();
            await tradingPage.fees.customInput.fill(customFee);
            feeRate = await tradingPage.fees.getBitcoinFeeRate('custom');

            // Wait for TX precomposition to avoid
            await new Promise(resolve => setTimeout(resolve, 2500));
        });

        await test.step('Continue Swap flow towards Send section', async () => {
            await tradingPage.swapBestOfferButton.click();
            await page.expectReduxObjectNotToBeEmpty('wallet.trading.composedTransactionInfo');
            await tradingPage.confirmation.openConfirmAndSendModal();
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
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Total amount'],
                        [`${totalAmount} BTC`],
                        ['incl. Transaction fee'],
                        [`${feeFromDeviceModal} BTC`],
                    ],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
        });

        await test.step('Verify Fee Info on emulator', async () => {
            await device.openFeeInfo({ buttonIndexT3W1: 2 });
            const feeRateWithoutDecimals = feeRate.replace('.00\u00A0', ' ');
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Fee info' },
                    body: [['Fee rate'], [feeRateWithoutDecimals]],
                },
                T3T1: { footer: undefined },
            });
        });
    });
});
