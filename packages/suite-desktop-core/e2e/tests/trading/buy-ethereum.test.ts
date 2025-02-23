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
        marketPage,
        trezorUserEnvLink,
    }) => {
        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openBuyTradingButton.click();
            await marketPage.selectAccount('Ethereum', 'eth');
            await marketPage.setYouBuyAmount(fiatAmount, 'ethereum');
            await expect(marketPage.bestOfferAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.quoteProvider).toHaveText(provider);
            await marketPage.buyBestOfferButton.click();
        });

        await test.step('Create Ethereum account in trade confirmation dialog', async () => {
            await marketPage.termsConfirmButton.click();
            await expect(marketPage.confirmationAccountDropdown).toHaveText(
                'Select ETHEREUM receive account',
            );
            await expect(marketPage.confirmationAddress).toHaveText('');
            await expect(page.getByText('Receive address is required')).toBeVisible();

            await marketPage.confirmationAccountDropdown.click();
            await page.getByRole('option', { name: 'Create a new Ethereum account' }).click();
            await expect(settingsPage.coins.networkButton('eth')).toBeEnabledCoin();
            await page.getByRole('button', { name: 'Find my Ethereum accounts' }).click();
            await dashboardPage.discoveryShouldFinish();
            await expect(marketPage.confirmationAccountDropdown).toHaveText(
                'Ethereum #1Balance: 0 ETH',
            );

            await expect(marketPage.confirmationAddress).toHaveValue(receiveAddress);
        });

        await test.step('Confirm Trade', async () => {
            await marketPage.confirmOnTrezorButton.click();
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddress(receiveAddress),
            );
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await devicePrompt.confirmOnDevicePromptIsHidden();

            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationProvider).toHaveText(
                capitalizeFirstLetter(provider),
            );
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            //TODO: #16766 Uncomment once the issue with the trade confirmation dialog is fixed
            //     await marketPage.confirmTradeButton.click();
            // });

            // await marketPage.waitForRedirectCompletion();

            // await test.step('Verify transaction detail', async () => {
            //     await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
            //     await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            //     await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            //     await expect(marketPage.confirmationProvider).toHaveText(provider);
        });
    });
});
