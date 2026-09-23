import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { localizeNumber } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const solSymbol = asNetworkSymbol('sol');

// Below ~50 USDC no live provider quotes the pair for US/CA.
const cryptoAmount = '100';
const cryptoTicker = 'USDC';
// Not every provider honours the exact crypto amount typed, so only the ticker is pinned.
const cryptoAmountPattern = new RegExp(String.raw`^[\d,]+(\.\d+)? ${cryptoTicker}$`);
const usdcCryptoId = getCryptoId(solSymbol, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const receiveAccountLabel = 'Solana #1';
const fiatCurrency = 'usd';

test.describe('Trading - Buy Solana token', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, walletPage, tradingMock }) => {
        tradingMock.setTradeFlow('buy');
        await tradingMock.rewriteProviderRedirect();
        await tradingMock.setStatus('SUBMITTED');

        await onboardingPage.completeOnboarding();

        await test.step('Enable Solana and open its trading', async () => {
            await settingsPage.changeNetworks({ enableNetworks: [solSymbol] });
            await walletPage.openTrading({ symbol: solSymbol });
        });
    });

    test(
        'Buy Solana USDC token - amount specified in crypto',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, tradingPage, tradingMock, tradingResponses }) => {
            let fiatAmount: string;
            let cryptoAmountOfOffer: string;
            let providerName: string;

            await test.step('Request a specific crypto amount of USDC to buy', async () => {
                await tradingPage.assetPicker.selectBuyAsset({
                    networkFilter: 'sol',
                    searchFilter: cryptoTicker,
                    assetCryptoId: usdcCryptoId,
                });
                await expect(tradingPage.inputs.youGetAssetSymbol).toHaveText(cryptoTicker);

                await tradingPage.fillBuyForm({
                    amount: cryptoAmount,
                    wantCrypto: true,
                    fiatCurrencyCode: fiatCurrency,
                    country: 'US',
                    countrySubdivision: 'CA',
                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(0);
                    },
                });
            });

            await test.step('Continue to the preview', async () => {
                await expect(tradingPage.inputs.fiatAmount).toHaveValue(/^[\d,]+(\.\d+)?$/);
                fiatAmount = await tradingPage.inputs.fiatAmount.inputValue();
                providerName = await tradingPage.quotes.selectedProviderName.innerText();

                await expect(tradingPage.buyBestOfferButton).toHaveTranslation('TR_CONTINUE');
                await tradingPage.buyBestOfferButton.click();

                await expect(tradingPage.confirmation.buyButton).toHaveTranslation(
                    'TR_TRADING_BUY_VIA',
                    { values: { providerName } },
                );
                await expect(tradingPage.kycWarning).toBeVisible();

                await expect(tradingPage.confirmation.cryptoAmount).toHaveText(cryptoAmountPattern);
                cryptoAmountOfOffer = await tradingPage.confirmation.cryptoAmount.innerText();
                await expect(tradingPage.confirmation.fiatAmount).toHaveText(
                    `$${localizeNumber(fiatAmount.replace(/,/g, ''), 'en-US', 2, 2)}`,
                );
                await expect(tradingPage.confirmation.provider).toHaveText(providerName);
                await expect(tradingPage.confirmation.paymentMethod).toHaveTranslation(
                    'TR_PAYMENT_METHOD_CREDITCARD',
                );
                await expect(tradingPage.confirmation.receiveAccount).toContainText(
                    receiveAccountLabel,
                );
            });

            await test.step('Confirm the trade', async () => {
                await page.clock.install();
                await tradingPage.confirmation.buyButton.click();

                const { exchange } = await tradingResponses.buy.trade();
                expect(await tradingResponses.buy.companyName(exchange)).toBe(providerName);
            });

            await tradingPage.waitForRedirectCompletion();

            await test.step('Verify transaction detail', async () => {
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
                );

                await tradingMock.advanceStatus('SUCCESS');

                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    'TR_BUY_DETAIL_COMPLETE_TITLE',
                );
                await expect(tradingPage.confirmation.cryptoAmount).toHaveText(cryptoAmountOfOffer);
                // The detail sidebar splits the row: the currency sits next to the flag, the
                // amount alone on the other side, trimmed of trailing zeros.
                await expect(tradingPage.confirmation.fiatCurrency).toHaveText(
                    fiatCurrency.toUpperCase(),
                );
                await expect(tradingPage.confirmation.fiatAmount).toHaveText(
                    localizeNumber(fiatAmount.replace(/,/g, ''), 'en-US'),
                );
                await expect(tradingPage.confirmation.provider).toHaveText(providerName);
                await expect(tradingPage.confirmation.paymentMethod).toHaveTranslation(
                    'TR_PAYMENT_METHOD_CREDITCARD',
                );
                await expect(tradingPage.confirmation.receiveAccount).toContainText(
                    receiveAccountLabel,
                );
            });

            await test.step('Return to account buy form', async () => {
                await tradingPage.backToAccountButton('Buy').click();
                await tradingPage.verifyBuyFormOpened(/BTC|SOL/);
            });
        },
    );
});
