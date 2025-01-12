import { test, expect } from '../../support/fixtures';

test.describe('Coinmarket Exchange', { tag: ['@group=other', '@snapshot'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        },
    });
    test.beforeEach(
        async ({ onboardingPage, dashboardPage, walletPage, settingsPage, trezorUserEnvLink }) => {
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('regtest');
            await trezorUserEnvLink.sendToAddressAndMineBlock({
                address: 'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
                btc_amount: 25,
            });
            await settingsPage.coins.enableNetwork('eth');
            await dashboardPage.navigateTo();
            await walletPage.openExchangeMarket({ symbol: 'regtest' });
        },
    );

    // TOOD: #16041 Once solved, fix and uncomment, We dont have enough founds to make the exchange
    test.skip('Exchange flow', async ({ marketPage, page }) => {
        await test.step('Wait for exchange form initialization and make visual comparison', async () => {
            await expect(marketPage.bestOfferAmount).toHaveText('0 BTC');
            await expect(marketPage.form).toHaveScreenshot('exchange-form.png', {
                mask: [marketPage.exchangeFeeDetails],
            });
        });

        await page
            .getByTestId('@coinmarket/form/select-crypto/input')
            .getByRole('combobox')
            .fill('ETH');
        await page.getByTestId('@coinmarket/form/select-crypto/option/ethereum').first().click();

        await page.getByTestId('@coinmarket/form/crypto-input').fill('0.005');
        await expect(page.getByText('Not enough funds')).toBeVisible();

        // Custom fee setup
        // await page.getByTestId('select-bar/custom').click();
        // await page.getByTestId('feePerUnit').fill('1');
        // await page.getByTestId('@coinmarket/exchange/compare-button').click();

        // TOOD: #16041 Once solved, Verifies the offers displayed match the mock

        // pass through initial run and device auth check
        // // Gets the deal
        // await page.getByTestId('@coinmarket/exchange/offers/get-this-deal-button').first().click();
        // await page.getByTestId('@modal').isVisible();
        // await page.getByTestId('@coinmarket/exchange/offers/buy-terms-confirm-button').click();
        // // Verifies amounts, currencies and providers
        // const wrapper = await page
        //     .locator('[class*="CoinmarketExchangeOfferInfo__Wrapper"]')
        //     .first();
        // await expect(wrapper.locator('[class*="FormattedCryptoAmount__Value"]').first()).toHaveText(
        //     testData.cryptoInput,
        // );
        // await expect(wrapper.locator('[class*="FormattedCryptoAmount__Value"]').nth(1)).toHaveText(
        //     testData.ethValue,
        // );
        // await expect(
        //     wrapper.locator('[class*="FormattedCryptoAmount__Container"]').first(),
        // ).toContainText('REGTEST');
        // await expect(
        //     wrapper.locator('[class*="FormattedCryptoAmount__Container"]').last(),
        // ).toContainText(testData.targetCrypto);
        // await expect(wrapper.locator('[class*="CoinmarketProviderInfo__Text"]')).toHaveText(
        //     'ChangeHero',
        // );
        // // Verifies receiving address and its title
        // const addressWrapper = await page.locator('[class*="VerifyAddress__Wrapper"]').first();
        // await expect(addressWrapper.locator('[class*="AccountLabeling__TabularNums"]')).toHaveText(
        //     'Ethereum #1',
        // );
        // await expect(addressWrapper.locator('[class*="Input__StyledInput"]')).toHaveValue(
        //     testData.ethAddress,
        // );
        // // Confirming the transaction
        // await page.getByTestId('@coinmarket/exchange/offers/confirm-on-trezor-button').click();
        // await devicePrompt.confirmOnDevicePromptIsShown();
        // await trezorUserEnvLink.pressYes();
        // await page.getByTestId('@coinmarket/exchange/offers/continue-transaction-button').click();
        // await page.getByTestId('@coinmarket/exchange/offers/confirm-on-trezor-and-send').click();
        // // Verification modal opens
        // await page.locator('[class*="OutputElement__OutputWrapper"]').first();
    });
});
