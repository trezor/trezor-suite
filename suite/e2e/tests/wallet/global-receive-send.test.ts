import { expect, test } from '../../support/fixtures';

const ETHEREUM_ADDRESS_3 = '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B';

test.describe('Global receive and send', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(`Global receive`, async ({ page, devicePrompt, tradingPage, walletPage }) => {
        await test.step('Open receive form', async () => {
            await page.getByTestId('@wallet/menu/wallet-global-receive').click();
            await expect(devicePrompt.header).toHaveTranslation('TR_NAV_RECEIVE');
        });

        await test.step('Filter and select account', async () => {
            await tradingPage.assetPicker.filterByNetwork('eth');
            await tradingPage.assetPicker
                .receiveOption({
                    accountType: 'normal',
                    accountSymbol: 'eth',
                    index: 2,
                })
                .click();
        });

        await test.step('Generate and compare addresses', async () => {
            await expect(
                page.getByTestId("@metadata/accountLabel/m/44'/60'/0'/0/2/hover-container"),
            ).toHaveTranslation('LABELING_ACCOUNT', {
                values: { networkName: 'Ethereum', index: '3' },
            });
            await walletPage.revealAddressButton.click();
            const addressDisplayedInSuite = await devicePrompt
                .outputValueOf('address')
                .textContent();
            if (!addressDisplayedInSuite) {
                throw new Error('Address is missing in receive modal');
            }
            expect.soft(addressDisplayedInSuite.replace(/\s/g, '')).toEqual(ETHEREUM_ADDRESS_3);
            const addressDisplayedOnDevice = await devicePrompt.getAddressFromDisplay();
            expect.soft(addressDisplayedOnDevice).toEqual(ETHEREUM_ADDRESS_3);
            await expect(walletPage.copyAddressButton).toBeEnabled();
        });
    });

    test(`Global send`, async ({ page, devicePrompt, walletPage, tradingPage }) => {
        await test.step('Open send form', async () => {
            await page.getByTestId('@wallet/menu/wallet-global-send').click();
            await expect(devicePrompt.header).toHaveTranslation('TR_NAV_SEND');
        });

        await test.step('Bitcoin account selection', async () => {
            await tradingPage.assetPicker.filterByNetwork('btc');
            await tradingPage.assetPicker.searchAsset('3');
            await tradingPage.assetPicker
                .sendOption({
                    accountType: 'normal',
                    accountSymbol: 'btc',
                    index: 2,
                })
                .click();
        });

        await test.step('Send form validation', async () => {
            await expect(walletPage.sendFormHeader).toHaveTranslation('TR_NAV_SEND');
            await expect(
                page.getByTestId("@metadata/accountLabel/m/84'/0'/2'/hover-container"),
            ).toHaveTranslation('LABELING_ACCOUNT', {
                values: { networkName: 'Bitcoin', index: '3' },
            });
        });
    });
});
