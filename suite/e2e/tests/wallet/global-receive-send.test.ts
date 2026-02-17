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

        await test.step('Add ETH account', async () => {
            await tradingPage.assets.addAccountButton.click();
            await page.getByTestId('@settings/wallet/network/eth').click();
            await tradingPage.receiveAccount.findAccountButton.click();
        });

        await test.step('Filter and select account', async () => {
            await tradingPage.assets.filterByNetwork('eth');
            await tradingPage.assets
                .receiveAssetPickerOption({
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

    test(`Global send`, async ({ page, devicePrompt, tradingPage }) => {
        await test.step('Open send form', async () => {
            await page.getByTestId('@wallet/menu/wallet-global-send').click();
            await expect(devicePrompt.header).toHaveTranslation('TR_NAV_SEND');
        });

        await test.step('Bitcoin account selection', async () => {
            await tradingPage.assets.filterByNetwork('btc');
            await tradingPage.assets.searchAsset('3');
            await tradingPage.assets
                .sendAssetPickerOption({
                    accountType: 'normal',
                    accountSymbol: 'btc',
                    index: 2,
                })
                .click();
        });

        await test.step('Send form validation', async () => {
            await expect(page.getByTestId('@wallet/send-header')).toHaveTranslation('TR_NAV_SEND');
            await expect(
                page.getByTestId("@metadata/accountLabel/m/84'/0'/2'/hover-container"),
            ).toHaveTranslation('LABELING_ACCOUNT', {
                values: { networkName: 'Bitcoin', index: '3' },
            });
        });
    });
});
