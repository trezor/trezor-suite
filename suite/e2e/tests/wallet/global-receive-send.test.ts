import { DEVICE_RENDERED_EVM_INDENT } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const ETHEREUM_ADDRESS_3 = '0x574BbB36871bA6b78E27f4B4dCFb76eA0091880B';
const DEVICE_ETHEREUM_ADDRESS_3 = `${DEVICE_RENDERED_EVM_INDENT}${ETHEREUM_ADDRESS_3}`;
const REGTEST_ADDRESS = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

test.describe('Global receive and send', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
    });

    test(`Global receive`, async ({ page, devicePrompt, tradingPage, walletPage }) => {
        await test.step('Open receive form', async () => {
            await page.getByTestId('@wallet/menu/wallet-global-receive').click();
            await expect(page.modalHeader).toHaveTranslation('TR_NAV_RECEIVE');
        });

        await test.step('Add ETH account', async () => {
            await tradingPage.assetPicker.globalAddAccountButton.click();
            await expect(walletPage.addAccountNetworkSearchInput).toBeVisible();
            await walletPage.addAccountNetworkSearchInput.fill('eth');
            await tradingPage.receiveAccount.addAccountModalNetworkButton('eth').click();
            await page.discoveryShouldFinish();
            await walletPage.closeAddAccountModal();
        });

        await test.step('Filter and select account', async () => {
            await tradingPage.assetPicker.filterSendReceiveByNetwork('eth');
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
            // The address is rendered on the receive screen itself, so there is no modal to read
            // it from; the labeling container is keyed by the address it renders.
            await expect(
                page.getByTestId(`@metadata/addressLabel/${ETHEREUM_ADDRESS_3}/hover-container`),
            ).toBeVisible();
            await walletPage.verifyAddressButton.click();
            const addressDisplayedOnDevice = await devicePrompt.getAddressFromDisplay();
            expect.soft(addressDisplayedOnDevice).toEqual(DEVICE_ETHEREUM_ADDRESS_3);
            await devicePrompt.waitForPromptAndConfirm();
            await expect(walletPage.copyAddressButton).toBeEnabled();
        });
    });

    test(`Global send`, async ({
        page,
        walletPage,
        tradingPage,
        settingsPage,
        dashboardPage,
        trezorUserEnv,
    }) => {
        // The send picker only lists accounts with a spendable balance and no mnemonic_all
        // mainnet account is funded, so the test funds a regtest account first.
        await test.step('Fund and enable a regtest account', async () => {
            await trezorUserEnv.sendToAddressAndMineBlock({
                address: REGTEST_ADDRESS,
                btc_amount: 1,
            });
            await settingsPage.navigateTo('application');
            await settingsPage.toggleDebugModeInSettings();
            await settingsPage.toggleTestnetNetworks();
            await settingsPage.changeNetworks({ enableNetworks: ['regtest'] });
            await dashboardPage.navigateTo();
        });

        await test.step('Open send form', async () => {
            await page.getByTestId('@wallet/menu/wallet-global-send').click();
            await expect(page.modalHeader).toHaveTranslation('TR_NAV_SEND');
        });

        await test.step('Bitcoin Regtest account selection', async () => {
            await tradingPage.assetPicker.filterSendReceiveByNetwork('regtest');
            await tradingPage.assetPicker
                .sendOption({
                    accountType: 'normal',
                    accountSymbol: 'regtest',
                    index: 0,
                })
                .click();
        });

        await test.step('Send form validation', async () => {
            await expect(walletPage.sendFormHeader).toHaveTranslation('TR_NAV_SEND');
            await expect(
                page.getByTestId("@metadata/accountLabel/m/84'/1'/0'/hover-container"),
            ).toHaveTranslation('LABELING_ACCOUNT', {
                values: { networkName: 'Bitcoin Regtest', index: '1' },
            });
        });
    });
});
