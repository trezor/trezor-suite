import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import { buyQuotesEthereum, buyTradeEthereum, invityEndpoint } from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesEthereum[3].fiatStringAmount;
const provider = capitalizeFirstLetter(buyQuotesEthereum[3].exchange);
const formattedCryptoAmount = `${localizeNumber(buyQuotesEthereum[3].receiveStringAmount)} ETH`;
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en', 2)}`;
const { receiveAddress, paymentMethodName } = buyTradeEthereum.trade;

test.describe('Trading - Buy Ethereum', { tag: ['@group=other', '@webOnly'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, dashboardPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesEthereum });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeEthereum);
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Enable Ethereum on account by buying it', async ({
        page,
        dashboardPage,
        settingsPage,
        devicePrompt,
        walletPage,
        tradingPage,
        trezorUserEnvLink,
    }) => {
        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openBuyTradingButton.click();
            await tradingPage.selectAccount('Ethereum', 'eth');
            await tradingPage.setYouBuyAmount(fiatAmount, 'ethereum');
            await expect(tradingPage.bestOfferAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.quoteProvider).toHaveText(provider);
            await tradingPage.buyBestOfferButton.click();
        });

        await test.step('Create Ethereum account in trade confirmation dialog', async () => {
            await tradingPage.termsConfirmButton.click();
            await expect(tradingPage.confirmationAccountDropdown).toHaveText(
                'Select ETHEREUM receive account',
            );
            await expect(tradingPage.confirmationAddress).toHaveText('');
            await tradingPage.confirmationAccountDropdown.click();
            await page.getByRole('option', { name: 'Create a new Ethereum account' }).click();
            await expect(settingsPage.coins.networkButton('eth')).toBeEnabledCoin();
            await page.getByRole('button', { name: 'Find my Ethereum accounts' }).click();
            await dashboardPage.discoveryShouldFinish();
            await expect(tradingPage.confirmationAccountDropdown).toHaveText(
                'Ethereum #1Balance: 0 ETH',
            );

            await expect(tradingPage.confirmationAddress).toHaveValue(receiveAddress);
        });

        await test.step('Check both Ethereum account are options on Confirmation screen', async () => {
            await tradingPage.confirmationAccountDropdown.click();
            await expect(page.getByRole('option', { name: 'Ethereum #1 ' })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Ethereum #2 ' })).toBeVisible();
            await tradingPage.confirmationAccountDropdown.click();
        });

        await test.step('Confirm Trade', async () => {
            await tradingPage.confirmOnTrezorButton.click();
            await expect(devicePrompt.headerParagraph).toHaveText('Ethereum #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddress(receiveAddress),
            );
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await devicePrompt.confirmOnDevicePromptIsHidden();

            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(
                capitalizeFirstLetter(provider),
            );
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await tradingPage.finishTransactionButton.click();
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(tradingPage.transactionDetailStatus).toHaveText('Approved');
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton.click();
            // The flow started on BTC so it returns to the BTC account, even tho the trade was for ETH
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy#\/btc\/0\/normal$/);
        });
    });
});
