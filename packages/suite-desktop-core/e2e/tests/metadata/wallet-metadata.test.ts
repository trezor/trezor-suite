import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

const standardWalletIndex = 0;
const hiddenWalletIndex = 1;

test.describe('Metadata - wallet labeling', { tag: ['@group=metadata2', '@webOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage, dashboardPage, metadataProviderMock }) => {
        await metadataProviderMock.start(MetadataProvider.DROPBOX);
        await onboardingPage.completeOnboarding({ enableViewOnly: true });
        await dashboardPage.discoveryShouldFinish();
    });

    test.use({
        emulatorSetupConf: {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        },
    });

    test('persists wallet labels', async ({
        page,
        dashboardPage,
        metadataPage,
        devicePrompt,
        trezorUserEnvLink,
        metadataProviderMock,
    }) => {
        // Setup standard wallet with label and edit it
        await page.getByTestId('@account-menu/btc/normal/0/label').click();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText('Bitcoin #1');

        await dashboardPage.openDeviceSwitcher();
        await metadataPage.wallet.clickAddLabel(standardWalletIndex);
        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);
        await metadataPage.wallet.fillLabelInput('label for standard wallet');
        await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
            'label for standard wallet',
        );

        await metadataPage.wallet.clickEditLabel(standardWalletIndex);
        await metadataPage.wallet.fillLabelInput('wallet for drugs');

        // Add hidden wallet and enable labeling
        await dashboardPage.addUnusedHiddenWallet('abc');

        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await dashboardPage.openDeviceSwitcher();
        await metadataPage.wallet.clickAddLabel(hiddenWalletIndex);
        await metadataPage.wallet.fillLabelInput('wallet not for drugs');

        // Verify wallet labels
        await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
            'wallet for drugs',
        );
        await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
            'wallet not for drugs',
        );

        // Remember wallet and reload app
        await dashboardPage.setViewOnlyForWallet(hiddenWalletIndex, 'enabled');
        await page.waitForTimeout(1000); // wait for changes to db
        await page.reload();
        await metadataProviderMock.setupWindowStubs();

        // Verify wallet labels after reload
        await dashboardPage.openDeviceSwitcher();

        await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
            'wallet for drugs',
        );
        await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
            'wallet not for drugs',
        );
    });

    test('labels can be enabled and edited when different wallet is open', async ({
        page,
        dashboardPage,
        metadataPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        // Setup standard wallet with label and edit it
        await page.getByTestId('@account-menu/btc/normal/0/label').click();
        await expect(page.getByTestId('@account-menu/btc/normal/0/label')).toHaveText('Bitcoin #1');

        await dashboardPage.openDeviceSwitcher();
        await metadataPage.wallet.clickAddLabel(standardWalletIndex);
        await metadataPage.passThroughInitMetadata(MetadataProvider.DROPBOX);
        await metadataPage.wallet.fillLabelInput('label for standard wallet');

        // Add passphrase wallet C and switch back to first wallet
        await dashboardPage.addUnusedHiddenWallet('C');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressNo();
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.openDevice(standardWalletIndex);

        // Enable labeling for wallet C
        await dashboardPage.openDeviceSwitcher();
        await metadataPage.wallet.clickAddLabel(hiddenWalletIndex);
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await metadataPage.wallet.fillLabelInput(
            'still works, metadata enabled for currently not selected device',
        );

        // Verify wallet labels
        await expect(metadataPage.wallet.walletLabel(standardWalletIndex)).toHaveText(
            'label for standard wallet',
        );
        await expect(metadataPage.wallet.walletLabel(hiddenWalletIndex)).toHaveText(
            'still works, metadata enabled for currently not selected device',
        );
    });

    test.afterEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.stop();
    });
});
