import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const correctPassphraseAddr =
    'addr1qx3ufjpwcx30ee73a7r29surauze6yt0jvr7c3rnahw0hnppg7qp5xvslcfucsqqayrtjhm4u66xsw987ae6ugydlzzsqdsfz4';
const passphrase = 'secret passphrase A';

test.describe('Passphrase with cardano', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });
    test.slow();

    test('verify cardano address behind passphrase', async ({
        device,
        settingsPage,
        dashboardPage,
        walletPage,
        metadataPage,
        devicePrompt,
    }) => {
        async function restartDevice() {
            await test.step('Restart device', async () => {
                await device.powerOff();
                await expect(walletPage.deviceDisconnectedStatus).toBeVisible({
                    timeout: 30_000,
                });
                await device.powerOn();
                await expect(walletPage.deviceConnectedStatus).toBeVisible({
                    timeout: 30_000,
                });
            });
        }

        await test.step('Starting discovery triggers passphrase dialogue', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['ada'] });
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphrase);
        });

        await restartDevice();

        await test.step('Reveal cardano address', async () => {
            await walletPage.openAccount({ symbol: 'ada', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
            await walletPage.revealAddressButton.click();
        });

        await test.step('Enter correct passphrase when device asks for passphrase after reset', async () => {
            await dashboardPage.passphraseInput.fill(passphrase);
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

            await expect(devicePrompt.outputValue).toHaveText(formatAddress(correctPassphraseAddr));

            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(device).toShowReceiveAddress(correctPassphraseAddr, {
                lineFormat: 'fullLine',
            });
            await device.pressYes(); // Confirm receive address

            await expect(metadataPage.copyAddressButton).toBeVisible();
            await devicePrompt.closeModal();
            await expect(walletPage.revealAddressButton).toBeVisible();
        });

        await restartDevice();

        await test.step('Reveal cardano address, now enter wrong passphrase', async () => {
            await walletPage.revealAddressButton.click();
            await dashboardPage.passphraseInput.fill('wrong passphrase');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

            await expect(walletPage.verifyAddressErrorToast).toBeVisible();
        });
    });
});
