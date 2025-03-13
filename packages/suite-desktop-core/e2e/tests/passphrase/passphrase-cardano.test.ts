import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const correctPassphraseAddr =
    'addr1qx3ufjpwcx30ee73a7r29surauze6yt0jvr7c3rnahw0hnppg7qp5xvslcfucsqqayrtjhm4u66xsw987ae6ugydlzzsqdsfz4';
const passphrase = 'secret passphrase A';

test.describe('Passphrase with cardano', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('verify cardano address behind passphrase', async ({
        page,
        settingsPage,
        dashboardPage,
        walletPage,
        devicePrompt,
        trezorUserEnvLink,
        emulatorStartConf,
    }) => {
        async function restartEmulator() {
            await trezorUserEnvLink.stopEmu();
            await expect(page.getByTestId('@deviceStatus-disconnected')).toBeVisible();
            await trezorUserEnvLink.startEmu({ model: emulatorStartConf.model, wipe: false });
            await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
        }

        await settingsPage.navigateTo('coins');
        await settingsPage.coins.enableNetwork('ada');

        // starting discovery triggers passphrase dialogue
        await dashboardPage.dashboardMenuButton.click();
        await dashboardPage.discoveryShouldFinish();
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.addUnusedHiddenWallet(passphrase);

        // turn on view-only on the hidden wallet
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.setViewOnlyForWallet(1, 'enabled');
        await dashboardPage.deviceSwitchingCloseButton.click();

        // restart device
        await restartEmulator();

        // reveal cardano address
        await walletPage.openAccount({ symbol: 'ada', type: 'normal', atIndex: 0 });
        await walletPage.receiveButton.click();
        await walletPage.revealAddressButton.click();

        // device after reset asks for passphrase again, enter correct passphrase associated with this account
        await dashboardPage.passphraseInput.fill(passphrase);
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        await expect(page.getByTestId('@modal/output-value')).toHaveText(
            formatAddress(correctPassphraseAddr),
        );

        await devicePrompt.confirmOnDevicePromptIsShown();
        await expect(devicePrompt).toDisplayReceiveAddress(correctPassphraseAddr, {
            lineFormat: 'fullLine',
        });
        await trezorUserEnvLink.pressYes(); // Confirm receive address

        await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
        await page.getByTestId('@modal/close-button').click();
        await expect(walletPage.revealAddressButton).toBeVisible();

        // restart device again
        await restartEmulator();

        // reveal cardano address, now enter wrong passphrase
        await walletPage.revealAddressButton.click();
        await dashboardPage.passphraseInput.fill('wrong passphrase');
        await dashboardPage.passphraseSubmitButton.click();
        await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
        await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

        await expect(page.getByTestId('@toast/verify-address-error')).toBeVisible();
    });
});
