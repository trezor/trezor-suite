import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

test.describe(
    'Metadata - cancel metadata on device',
    { tag: ['@group=metadata', '@webOnly'] },
    () => {
        test.use({
            emulatorSetupConf: {
                mnemonic: 'mnemonic_all',
                passphrase_protection: true,
            },
        });
        test.beforeEach(async ({ metadataMock }) => {
            await metadataMock.start(MetadataProvider.DROPBOX);
        });

        //TODO: Update and enable once metadata reimplemented or bug #19740 is resolved
        test.skip('user cancels metadata on device, choice is respected on subsequent runs but only for the cancelled wallet', async ({
            page,
            onboardingPage,
            dashboardPage,
            settingsPage,
            metadataPage,
            walletPage,
            devicePrompt,
            trezorUserEnvLink,
        }) => {
            await onboardingPage.completeOnboarding();

            await settingsPage.navigateTo('application');
            await expect(settingsPage.metadataSwitch.locator('input')).not.toBeChecked();

            // Navigate to account and hover over add label button
            await page.getByTestId('@suite/menu/suite-index').click();
            await walletPage.openAccount();
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressNo();

            // Reload app, cancel metadata again, and remember device
            await page.reload();
            await devicePrompt.confirmOnDevicePromptIsShown({ timeout: 15_000 });
            await trezorUserEnvLink.pressNo();

            await page.discoveryShouldFinish();

            await page.reload();

            // Add another wallet, enable labeling on the new device
            await page.getByTestId('@menu/switch-device').click();
            await dashboardPage.addUnusedHiddenWallet('abc');

            await expect(page.getByTestId('@passphrase/input')).toBeHidden();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            // Close connect to data provider modal
            await devicePrompt.closeModal();

            // Forget device and reload
            await page.getByTestId('@menu/switch-device').click();

            await page.getByTestId('@switch-device/wallet-on-index/0/eject-button').click();
            await page.getByTestId('@switch-device/eject').click();
            await page.getByTestId('@switch-device/wallet-on-index/0/eject-button').click();
            await page.getByTestId('@switch-device/eject').click();
            await page.reload();

            // Enable labeling dialogue appears again
            await devicePrompt.confirmOnDevicePromptIsShown({ timeout: 15_000 });
            await trezorUserEnvLink.pressNo();
        });

        test.afterEach(async ({ metadataMock }) => {
            await metadataMock.stop();
        });
    },
);
