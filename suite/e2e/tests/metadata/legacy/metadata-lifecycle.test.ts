import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

test.describe('Metadata lifecycle', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        },
    });
    test.beforeEach(async ({ metadataMock, onboardingPage }) => {
        await metadataMock.start(MetadataProvider.DROPBOX);
        await onboardingPage.completeOnboarding();
    });

    test('Choice persistence and reset behavior', async ({
        page,
        device,
        dashboardPage,
        settingsPage,
        metadataPage,
        walletPage,
        devicePrompt,
    }) => {
        await settingsPage.navigateTo('application');
        await expect(settingsPage.metadataSelectInput).toHaveTranslation('TR_LABELING_OFF');

        await test.step('enable legacy labeling via settings', async () => {
            await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
        });

        await test.step('verify labeling is active', async () => {
            await walletPage.openAccount();
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.account.fillLabelInput('test label');
            await metadataPage.account.successIconIsVisible(AccountLabelId.BitcoinDefault1);
        });

        await test.step('add another wallet, enable labeling on the new device', async () => {
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addUnusedHiddenWallet('abc');
            await expect(dashboardPage.passphraseInput).toBeHidden();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
        });

        await test.step('disable metadata in settings', async () => {
            await settingsPage.navigateTo('application');
            await page.selectDropdownOptionWithRetry(
                settingsPage.metadataSelectInput,
                settingsPage.metadataSelectInputOption('off'),
            );
            await expect(settingsPage.metadataSelectInput).toHaveTranslation('TR_LABELING_OFF');
        });

        await test.step('forget device and reload', async () => {
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.walletAtIndexEjectButton(0).click();
            await dashboardPage.confirmDeviceEjectButton.click();
            await dashboardPage.walletAtIndexEjectButton(0).click();
            await dashboardPage.confirmDeviceEjectButton.click();
            await dashboardPage.addStandardWalletButton.click();
            await page.discoveryShouldFinish();
        });

        await test.step('re-enable labeling on standard Wallet via settings', async () => {
            await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
            await settingsPage.navigateTo('application');
            await expect(settingsPage.metadataSelectInput).toHaveTranslation('TR_LABELING_LEGACY');
        });

        await test.step('disable metadata in settings', async () => {
            await page.selectDropdownOptionWithRetry(
                settingsPage.metadataSelectInput,
                settingsPage.metadataSelectInputOption('off'),
            );
            await expect(settingsPage.metadataSelectInput).toHaveTranslation('TR_LABELING_OFF');
        });

        await test.step('verify labeling can be re-enabled via settings', async () => {
            await metadataPage.enableLegacyLabeling(MetadataProvider.DROPBOX);
            await settingsPage.navigateTo('application');
            await expect(settingsPage.metadataSelectInput).toHaveTranslation('TR_LABELING_LEGACY');
        });
    });
});
