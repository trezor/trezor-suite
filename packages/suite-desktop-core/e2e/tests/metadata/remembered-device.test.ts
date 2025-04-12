import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

//Metadata - In settings, there is enable metadata switch.
//On enable, it initiates metadata right away (if device already has state).
//On disable, it throws away all metadata related records from memory.
test.describe('Remembered device', { tag: ['@group=metadata', '@webOnly'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { mnemonic: 'mnemonic_all' },
    });
    test.beforeEach(async ({ metadataMock }) => {
        await metadataMock.start(MetadataProvider.GOOGLE);
        await metadataMock.setFileContent(
            'f7acc942eeb83921892a95085e409b3e6b5325db6400ae5d8de523a305291dca.mtdt',
            metadataMock.defaultFileContent,
            metadataMock.defaultAesKey,
        );
    });

    test('google provider', async ({
        page,
        onboardingPage,
        settingsPage,
        metadataPage,
        walletPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await onboardingPage.completeOnboarding({ enableViewOnly: true });

        await page.getByTestId('@account-menu/btc/normal/0/label').click();

        await settingsPage.navigateTo('application');
        await settingsPage.metadataSwitch.click();
        await metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE);

        // Now metadata is enabled, go to accounts and see what we got loaded from provider
        await walletPage.openAccount();

        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
            'already existing label',
        );

        // device not saved, disconnect provider
        // Now go back to settings, disconnect provider and check that we don't see metadata in app
        await settingsPage.navigateTo('application');
        await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
        await expect(page.getByTestId('@settings/metadata/connect-provider-button')).toBeVisible();
        await walletPage.openAccount();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).not.toContainText(
            'already existing label',
        );

        // At this moment, there are no labels. But we still can see "add label" button, which inits metadata flow but without obtaining keys from device (they are saved!)
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
        await metadataPage.metadataProviderButton(MetadataProvider.GOOGLE).click();
        await expect(metadataPage.metadataModal).not.toBeVisible();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
            'already existing label',
        );

        // device not saved, disable metadata
        await settingsPage.navigateTo('application');
        await page.getByTestId('@settings/metadata-switch').click();
        await walletPage.openAccount();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).not.toContainText(
            'label',
        );
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);

        // disabling metadata removed also all keys, so metadata init flow takes all steps now expect for providers, these stay connected
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await page.waitForTimeout(1000);

        // device saved, disconnect provider
        await page.getByTestId('@menu/switch-device').click();
        await page.getByTestId('@switch-device/wallet-on-index/0').click();

        await trezorUserEnvLink.stopEmu();

        // Device is saved, when disconnected, user still can edit labels
        await metadataPage.account.editLabel(
            AccountLabelId.BitcoinDefault1,
            'edited for remembered',
        );
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
            'edited for remembered',
        );

        // Now again, lets try disconnecting provider
        await settingsPage.navigateTo('application');
        await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
        await walletPage.openAccount();

        // Disconnecting removes labels
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText('Bitcoin');

        // Still possible to reconnect provider, we have keys still saved
        await metadataPage.account.clickAddLabelButton(AccountLabelId.BitcoinDefault1);
        await metadataPage.metadataProviderButton(MetadataProvider.GOOGLE).click();
        await expect(metadataPage.metadataModal).not.toBeVisible();
        await metadataPage.account.fillLabelInput('mnau');
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText('mnau');

        // device saved, disable metadata
        await settingsPage.navigateTo('application');
        await page.getByTestId('@settings/metadata-switch').click();
        await walletPage.openAccount();

        // Now it is not possible to add labels, keys are gone and device is not connected
        await expect(
            metadataPage.account.addLabelButton(AccountLabelId.BitcoinDefault1),
        ).not.toBeVisible();
    });
});
