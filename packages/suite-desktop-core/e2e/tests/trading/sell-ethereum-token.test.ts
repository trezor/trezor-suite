import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesEthereumToken,
    sellTradeEthereumToken,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const mnemonic =
    'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesEthereumToken[0].fiatStringAmount;
const cryptoAmount = sellQuotesEthereumToken[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesEthereumToken[0].exchange, 'sellList');
// const providerAddress = sellWatch.destinationAddress;
// const providerPaymentId = sellWatch.destinationPaymentExtraId;
// const formattedCryptoAmount = `${cryptoAmount} BTC`;
// const formattedFiatAmount = `€${fiatAmount}`;
// const { paymentMethodName } = sellTradeBTC.trade;

test.describe('Trading - Sell Ethereum', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic, passphrase_protection: true },
    });
    test.beforeEach(
        async ({ page, marketPage, onboardingPage, dashboardPage, settingsPage, walletPage }) => {
            if (!process.env.PASSPHRASE) {
                throw new Error(
                    'PASSPHRASE not provided in env variables. Check docs/tests/e2e-playwright-suite.md.',
                );
            }
            await marketPage.mockInvity();
            await marketPage.mockInvityTrade(sellTradeEthereumToken, invityEndpoint.sellTrade);
            await page.route(invityEndpoint.sellQuotes, async route => {
                await route.fulfill({ json: sellQuotesEthereumToken });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('eth');
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.accountButton({ symbol: 'eth', tokens: true }).click();
            await page.getByRole('row', { name: 'USD Coin' }).getByRole('button').first().click();
            await page.getByTestId('@trading/tokens/sell-button').click();
        },
    );

    test('Sell Ethereum', async ({ marketPage }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.selectCountryOfResidence('CZ');
            await marketPage.youPayCryptoInput.fill(cryptoAmount);
            await marketPage.waitForSellOffersSync();
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.formSellButton.click();
            await marketPage.sellTermsConfirmButton.click();
        });

        // TODO: Fix the redirection. I need to troubleshoot this with the team.
        // await test.step('Wait for the redirection to complete', async () => {
        //     await expect(page.getByText('Buy & sell')).not.toBeVisible();
        //     await expect(page.getByText('Buy & sell')).toBeVisible({ timeout: 15_000 });
        // });

        // await test.step('Verify all confirmation values', async () => {
        //     await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
        //     await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
        //     await expect(marketPage.confirmationProvider).toHaveText(provider);
        //     await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
        //     await expect(marketPage.confirmationAddress).toHaveText(providerAddress);
        //     await expect(marketPage.confirmationAccount).toHaveText('Bitcoin #1');
        //     await expect(page.getByTestId('@trading/form/verify/extra-id')).toHaveText(
        //         providerPaymentId,
        //     );
        // });

        // await test.step('Initiate send', async () => {
        //     await marketPage.confirmTradeButton.click();
        //     await expect(devicePrompt.sellButton).toBeDisabled();
        //     await devicePrompt.confirmOnDevicePromptIsShown();
        //     await trezorUserEnvLink.pressYes();
        //     await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(formattedCryptoAmount);
        //     await devicePrompt.confirmOnDevicePromptIsShown();
        //     await trezorUserEnvLink.pressYes();
        //     // Note: We intentionally skip clicking the sell button in tests to prevent actual cryptocurrency transactions.
        //     // In a real scenario, the user would complete the transaction by clicking this button.
        //     await expect(devicePrompt.sellButton).toBeEnabled();
        // });
    });
});
