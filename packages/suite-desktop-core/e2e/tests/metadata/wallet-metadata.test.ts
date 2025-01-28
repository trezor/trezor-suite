import { test, expect } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataProviderMock';

const standardWalletIndex = 0;
const hiddenWalletIndex = 1;

test.describe('Metadata - wallet labeling', { tag: ['@group=metadata', '@webOnly'] }, () => {
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
        expect(await metadataPage.wallet.getLabel(standardWalletIndex)).toBe(
            'label for standard wallet',
        );

        await metadataPage.wallet.clickEditLabel(standardWalletIndex);
        await metadataPage.wallet.fillLabelInput('wallet for drugs');

        // Add hidden wallet and enable labeling
        await dashboardPage.addHiddenWallet('abc');

        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await dashboardPage.openDeviceSwitcher();
        await metadataPage.wallet.clickAddLabel(hiddenWalletIndex);
        await metadataPage.wallet.fillLabelInput('wallet not for drugs');

        // Verify wallet labels
        expect(await metadataPage.wallet.getLabel(standardWalletIndex)).toBe('wallet for drugs');
        expect(await metadataPage.wallet.getLabel(hiddenWalletIndex)).toBe('wallet not for drugs');

        // Remember wallet and reload app
        await dashboardPage.setViewOnlyForWallet(hiddenWalletIndex, 'enabled');
        await page.waitForTimeout(1000); // wait for changes to db
        await page.reload();
        await metadataProviderMock.setupWindowStubs();

        // Verify wallet labels after reload
        await dashboardPage.openDeviceSwitcher();

        expect(await metadataPage.wallet.getLabel(standardWalletIndex)).toBe('wallet for drugs');
        expect(await metadataPage.wallet.getLabel(hiddenWalletIndex)).toBe('wallet not for drugs');
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
        await dashboardPage.addHiddenWallet('C');
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
        expect(await metadataPage.wallet.getLabel(standardWalletIndex)).toBe(
            'label for standard wallet',
        );
        expect(await metadataPage.wallet.getLabel(hiddenWalletIndex)).toBe(
            'still works, metadata enabled for currently not selected device',
        );
    });

    test.afterEach(async ({ metadataProviderMock }) => {
        await metadataProviderMock.stop();
    });
});
