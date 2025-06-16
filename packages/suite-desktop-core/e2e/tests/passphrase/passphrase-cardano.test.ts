import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const correctPassphraseAddr =
    'addr1qx3ufjpwcx30ee73a7r29surauze6yt0jvr7c3rnahw0hnppg7qp5xvslcfucsqqayrtjhm4u66xsw987ae6ugydlzzsqdsfz4';
const passphrase = 'secret passphrase A';

test.describe('Passphrase with cardano', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
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
            await test.step('Restart emulator', async () => {
                await trezorUserEnvLink.stopEmu();
                await expect(page.getByTestId('@deviceStatus-disconnected')).toBeVisible();
                await trezorUserEnvLink.startEmu({ model: emulatorStartConf.model, wipe: false });
                await expect(page.getByTestId('@deviceStatus-connected')).toBeVisible();
            });
        }

        await test.step('Starting discovery triggers passphrase dialogue', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['ada'] });
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet(passphrase);
        });

        await test.step('Turn on view-only on the hidden wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.setViewOnlyForWallet(1, 'enabled');
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await restartEmulator();

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

            await expect(page.getByTestId('@modal/output-value')).toHaveText(
                formatAddress(correctPassphraseAddr),
            );

            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(devicePrompt).toDisplayReceiveAddress(correctPassphraseAddr, {
                lineFormat: 'fullLine',
            });
            await trezorUserEnvLink.pressYes(); // Confirm receive address

            await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
            await devicePrompt.closeModal();
            await expect(walletPage.revealAddressButton).toBeVisible();
        });

        await restartEmulator();

        await test.step('Reveal cardano address, now enter wrong passphrase', async () => {
            await walletPage.revealAddressButton.click();
            await dashboardPage.passphraseInput.fill('wrong passphrase');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase

            await expect(page.getByTestId('@toast/verify-address-error')).toBeVisible();
        });
    });
});
