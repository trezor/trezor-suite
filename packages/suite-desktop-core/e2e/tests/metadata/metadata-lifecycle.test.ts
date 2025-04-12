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

        //TODO: #17855 Fix unstable test
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
            await onboardingPage.completeOnboarding({ enableViewOnly: false });

            await settingsPage.navigateTo('application');
            await expect(
                page.getByTestId('@settings/metadata-switch').locator('input'),
            ).not.toBeChecked();

            // Navigate to account and hover over add label button
            await page.getByTestId('@suite/menu/suite-index').click();
            await walletPage.openAccount();
            await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressNo();

            // Reload app, cancel metadata again, and remember device
            await page.reload();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressNo();

            await dashboardPage.discoveryShouldFinish();
            await dashboardPage.deviceSwitchingOpenButton.click();
            await page.getByTestId('@viewOnlyStatus/disabled').click();
            await page.getByTestId('@viewOnly/radios/enabled').click();

            await page.reload();

            // Add another wallet, enable labeling on the new device
            await page.getByTestId('@menu/switch-device').click();
            await dashboardPage.addUnusedHiddenWallet('abc');

            await expect(page.getByTestId('@passphrase/input')).not.toBeVisible();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            // Close connect to data provider modal
            await page.getByTestId('@modal/close-button').click();

            // Forget device and reload
            await page.getByTestId('@menu/switch-device').click();

            await page.getByTestId('@switch-device/wallet-on-index/0/eject-button').click();
            await page.getByTestId('@switch-device/eject').click();
            await page.getByTestId('@switch-device/wallet-on-index/0/eject-button').click();
            await page.getByTestId('@switch-device/eject').click();
            await page.reload();

            // Enable labeling dialogue appears again
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressNo();
        });

        test.afterEach(async ({ metadataMock }) => {
            await metadataMock.stop();
        });
    },
);
