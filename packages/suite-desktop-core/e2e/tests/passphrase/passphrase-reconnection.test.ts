import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';

test.describe('Passphrase reconnection', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    // add 1st hidden wallet (abc)
    // check 1st address
    // disconnect device
    // reconnect device
    // go back to 1st hidden wallet
    // check confirm passphrase appears.
    // TODO: #17161 Fix unstable test
    test.skip('after device is reconnected passphrase needs to be confirmed', async ({
        page,
        dashboardPage,
        walletPage,
        devicePrompt,
        trezorUserEnvLink,
        emulatorStartConf,
    }) => {
        // add 1st hidden wallet
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet('abc');

        await walletPage
            .accountButton({
                symbol: 'btc',
                type: 'normal',
                atIndex: 0,
            })
            .click();
        await walletPage.receiveButton.click();
        await walletPage.revealAddressButton.click();
        await expect(page.getByTestId('@modal/output-value')).toHaveText(formatAddress(abcAddr));
        await devicePrompt.confirmOnDevicePromptIsShown();
        await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();

        // disconnect and reconnect device
        await trezorUserEnvLink.stopEmu();
        await trezorUserEnvLink.startEmu({ model: emulatorStartConf.model, wipe: false });

        // Passphrase abc again. now it is cached in device
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.walletAtIndex(1).click();
        await walletPage.receiveButton.click();
        await expect(page.getByTestId('@wallet/receive/used-address/0')).not.toBeVisible();
        await expect(walletPage.revealAddressButton).not.toBeDisabled();
        await walletPage.revealAddressButton.click();

        // re-enter passphrase
        await dashboardPage.passphraseInput.fill('abc');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        // check address
        await expect(page.getByTestId('@modal/output-value')).toHaveText(formatAddress(abcAddr));
        await devicePrompt.confirmOnDevicePromptIsShown();
        await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();

        // now should show new address without entering passphrase
        await walletPage.revealAddressButton.click();
        await expect(page.getByTestId('@modal/output-value')).toBeVisible();
        await trezorUserEnvLink.pressYes(); // confirm address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

        await page.getByTestId('@modal/close-button').click();
    });
});
