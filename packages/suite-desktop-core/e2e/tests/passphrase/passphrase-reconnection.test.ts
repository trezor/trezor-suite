import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';

test.describe('Passphrase reconnection', { tag: ['@group=passphrase'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('after device is reconnected passphrase needs to be confirmed', async ({
        page,
        dashboardPage,
        walletPage,
        devicePrompt,
        trezorUserEnvLink,
        emulatorStartConf,
    }) => {
        await test.step('Add passphrase wallet "abc"', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addUnusedHiddenWallet('abc');
        });

        await test.step('Display receive address', async () => {
            await walletPage.openAccount({
                symbol: 'btc',
                type: 'normal',
                atIndex: 0,
            });
            await walletPage.receiveButton.click();
            await walletPage.revealAddressButton.click();
            await expect(page.getByTestId('@modal/output-value')).toHaveText(
                formatAddress(abcAddr),
            );
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
            await trezorUserEnvLink.pressYes(); // confirm address

            await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
            await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();

            await devicePrompt.closeModal();
        });

        await test.step('Disconnect and reconnect the device', async () => {
            await trezorUserEnvLink.stopEmu();
            await trezorUserEnvLink.startEmu({ model: emulatorStartConf.model, wipe: false });
        });

        await test.step('Check passphrase wallet "abc" is still cached and connected', async () => {
            await dashboardPage.deviceSwitchingOpenButton.click();
            // Clicking on the device switcher button should either open the modal or show the "Unavailable while loading" message
            await Promise.race([
                expect(dashboardPage.deviceSwitcherModal).toBeVisible(),
                expect(page.getByText('Unavailable while loading')).toBeVisible(),
            ]);
            const deviceSwitchUnavailable = page.getByText('Unavailable while loading').isVisible();
            // If the device switcher is unavailable, we need to wait for discovery to finish and then open the device switcher again
            if (await deviceSwitchUnavailable) {
                await page.discoveryShouldFinish();
                await dashboardPage.openDeviceSwitcher();
            }

            await expect(dashboardPage.walletAtIndex(1)).toContainText('Passphrase wallet #1');
        });

        await test.step('Displaying receive address should prompt for passphrase', async () => {
            await dashboardPage.walletAtIndex(1).click();
            await walletPage.receiveButton.click();
            await expect(page.getByTestId('@wallet/receive/used-address/0')).not.toBeVisible();
            await expect(walletPage.revealAddressButton).not.toBeDisabled();
            await walletPage.revealAddressButton.click();
            await expect(page.getByText('Confirm passphrase')).toBeVisible();
            await dashboardPage.passphraseInput.fill('abc');
            await dashboardPage.passphraseSubmitButton.click();
            await devicePrompt.waitForPromptAndConfirm(); // Confirm next screen shows your passphrase
            await devicePrompt.waitForPromptAndConfirm(); // Confirm passphrase, shows your address
        });

        await test.step('Verify displayed receive address', async () => {
            await expect(page.getByTestId('@modal/output-value')).toHaveText(
                formatAddress(abcAddr),
            );
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(devicePrompt).toDisplayReceiveAddress(abcAddr);
            await trezorUserEnvLink.pressYes(); // confirm address
            await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
            await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();
            await devicePrompt.closeModal();
        });

        await test.step('Second displaying receive address after reconnect should NOT prompt for passphrase', async () => {
            await walletPage.revealAddressButton.click();
            await expect(page.getByTestId('@modal/output-value')).toBeVisible();
            await trezorUserEnvLink.pressYes(); // confirm address
            await expect(page.getByTestId('@metadata/copy-address-button')).toBeVisible();
            await expect(page.getByTestId('@metadata/copy-address-button')).not.toBeDisabled();
        });
    });
});
