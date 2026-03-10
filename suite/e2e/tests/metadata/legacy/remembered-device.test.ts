import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { MetadataProvider } from '../../../support/mocks/metadataMock';

//Metadata - In settings, there is enable metadata switch.
//On enable, it initiates metadata right away (if device already has state).
//On disable, it throws away all metadata related records from memory.
test.describe('Remembered device', { tag: ['@webOnly', '@T2T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_all' },
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
        device,
        onboardingPage,
        settingsPage,
        metadataPage,
        walletPage,
        devicePrompt,
    }) => {
        await test.step('Complete onboarding and open BTC account', async () => {
            await onboardingPage.completeOnboarding();
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await settingsPage.navigateTo('application');
        });

        await test.step('Enable metadata (legacy) and initialize with Google provider', async () => {
            await page.selectDropdownOptionWithRetry(
                settingsPage.metadataSelectInput,
                settingsPage.metadataSelectInputOption('legacy'),
            );
            await metadataPage.passThroughInitMetadata(MetadataProvider.GOOGLE);
        });

        await test.step('Verify metadata loaded from provider', async () => {
            await walletPage.openAccount();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
                'already existing label',
            );
        });

        // device not saved, disconnect provider
        await test.step('Disconnect provider and verify metadata is not visible', async () => {
            await settingsPage.navigateTo('application');
            await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
            await expect(
                page.getByTestId('@settings/metadata/connect-provider-button'),
            ).toBeVisible();
            await walletPage.openAccount();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).not.toContainText(
                'already existing label',
            );
        });

        // At this moment, there are no labels. But we still can see "add label" button, which inits metadata flow but without obtaining keys from device (they are saved!)
        await test.step('Edit label after disconnecting provider (keys are saved)', async () => {
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.metadataProviderButton(MetadataProvider.GOOGLE).click();
            await expect(metadataPage.metadataModal).toBeHidden();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
                'already existing label',
            );
        });

        // device not saved, disable metadata
        await test.step('Disable metadata and verify all keys and metadata are removed', async () => {
            await settingsPage.navigateTo('application');
            await page.selectDropdownOptionWithRetry(
                settingsPage.metadataSelectInput,
                settingsPage.metadataSelectInputOption('off'),
            );
            await walletPage.openAccount();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).not.toContainText(
                'label',
            );
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);

            // disabling metadata removed also all keys, so metadata init flow takes all steps now expect for providers, these stay connected

            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            await page.waitForTimeout(1000);
        });

        // device saved, disconnect provider
        await test.step('Switch device, stop emulator, and edit label on remembered device', async () => {
            await page.getByTestId('@menu/switch-device').click();
            await page.getByTestId('@switch-device/wallet-on-index/0').click();
            await device.powerOff();

            // Device is saved, when disconnected, user still can edit labels
            await metadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: 'edited for remembered',
            });
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
                'edited for remembered',
            );
        });

        await test.step('Disconnect provider again and verify labels are removed', async () => {
            await settingsPage.navigateTo('application');
            await page.getByTestId('@settings/metadata/disconnect-provider-button').click();
            await walletPage.openAccount();
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
                'Bitcoin',
            );
        });

        await test.step('Still possible to reconnect provider, we have keys still saved', async () => {
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.metadataProviderButton(MetadataProvider.GOOGLE).click();
            await expect(metadataPage.metadataModal).toBeHidden();
            await metadataPage.account.fillLabelInput('mnau');
            await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toContainText(
                'mnau',
            );
        });

        // device saved, disable metadata
        // TODO: Not possible to disabled the metadata in this state, the dropdown is greyed out.
        // await test.step(
        //     'Disable metadata and verify editing labels is not possible',
        //     async () => {
        //         await settingsPage.navigateTo('application');
        //         await page.selectDropdownOptionWithRetry(
        //             settingsPage.metadataSelectInput,
        //             settingsPage.metadataSelectInputOption('off'),
        //         );
        //         await walletPage.openAccount();

        //         // Now it is not possible to add labels, keys are gone and device is not connected
        //         await expect(
        //             metadataPage.account.editLabelButton(AccountLabelId.BitcoinDefault1),
        //         ).toBeHidden();
        //     },
        // );
    });
});
