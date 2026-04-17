import { mnemonic12Fixtures } from '@suite-common/e2e-evolu-client';

import { launchSuite } from '../../../support/electron';
import { AccountLabelId } from '../../../support/enums/accountLabelId';
import { expect, test } from '../../../support/fixtures';
import { AnalyticsSection } from '../../../support/pageObjects/analyticsSection';
import { DashboardPage } from '../../../support/pageObjects/dashboardPage';
import { DevicePrompt } from '../../../support/pageObjects/devicePrompt';
import { MetadataPage } from '../../../support/pageObjects/metadata/metadataPage';
import { OnboardingPage } from '../../../support/pageObjects/onboarding/onboardingPage';
import { SettingsPage } from '../../../support/pageObjects/settings/settingsPage';
import { WalletPage } from '../../../support/pageObjects/walletPage';
import { enhancePage } from '../../../support/testExtends/enhancePage';

const { ownerSecret, buildExpectedWallet, buildExpectedAccount } = mnemonic12Fixtures;
const WALLET_INDEX = 0;

const expectedWallet = buildExpectedWallet({
    label: 'Evolu write wallet',
});

const expectedAccount = buildExpectedAccount({
    label: 'Evolu write BTC account',
});

test.describe('Suite Sync - Labelling', { tag: ['@specificFirmware', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { passphrase_protection: true },
        wipeEvoluRelay: true,
    });

    // lets see if this helps test.use({ context: undefined });
    test.beforeEach(async ({ onboardingPage, metadataPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await metadataPage.setupQuotaManager();
        await metadataPage.enableSuiteSync();
    });

    test('Create new labels', async ({
        evoluClient,
        device,
        dashboardPage,
        metadataPage,
        page,
    }, testInfo) => {
        await test.step('Change wallet label', async () => {
            await dashboardPage.openDeviceSwitcher();
            await metadataPage.wallet.changeLabel({
                index: WALLET_INDEX,
                label: 'initial label',
            });
            await expect
                .soft(metadataPage.wallet.walletLabel(WALLET_INDEX))
                .toHaveText(expectedWallet.label);
            await dashboardPage.deviceSwitchingCloseButton.click();
        });
        await page.close();

        await new Promise(resolve => setTimeout(resolve, 10000));

        const offlineSuite = await launchSuite({
            offlineMode: true,
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
            // keepUserData: true,  somehow this persistent data breaks the restarting of the app in offline mode, need to investigate why, for now we can do without it as we are not testing persistence across app restarts in this test
        });
        await offlineSuite.electronApp.context().setOffline(true);
        enhancePage(offlineSuite.window);
        await offlineSuite.window.title();

        const offlineDevicePrompt = new DevicePrompt(offlineSuite.window, device);

        const offlineOnboardingPage = new OnboardingPage(
            offlineSuite.window,
            device,
            offlineDevicePrompt,
            new AnalyticsSection(offlineSuite.window),
            new SettingsPage(offlineSuite.window, device),
        );
        const offlineMetadataPage = new MetadataPage(
            offlineSuite.window,
            device,
            new SettingsPage(offlineSuite.window, device),
            offlineDevicePrompt,
        );
        const offlineWalletPage = new WalletPage(offlineSuite.window);
        const offlinedashboardPage = new DashboardPage(
            offlineSuite.window,
            device,
            offlineDevicePrompt,
        );

        await offlineOnboardingPage.disableNecessaryFirmwareChecks();
        await expect(
            offlineSuite.window.getByTestId('@suite/no-connection-banner'),
        ).toHaveTranslation('TR_YOU_WERE_DISCONNECTED_DOT');
        await offlineOnboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
        await offlineMetadataPage.setupQuotaManager();
        await offlineMetadataPage.enableSuiteSync();

        await test.step('Change BTC account label', async () => {
            await offlineWalletPage
                .accountButton({ symbol: 'btc', type: 'normal', atIndex: 0 })
                .click();
            await offlineMetadataPage.account.changeLabel({
                accountId: AccountLabelId.BitcoinDefault1,
                label: expectedAccount.label,
            });

            // web test bude ciste o spatne port URL relaye

            await expect
                .soft(offlineWalletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
                .toHaveText(expectedAccount.label, { timeout: 30_000 });
        });

        await test.step('Change wallet label', async () => {
            await offlinedashboardPage.openDeviceSwitcher();
            await offlineSuite.window.pause();
            await offlineMetadataPage.wallet.changeLabel({
                index: WALLET_INDEX,
                label: expectedWallet.label,
            });
            await expect
                .soft(offlineMetadataPage.wallet.walletLabel(WALLET_INDEX))
                .toHaveText(expectedWallet.label);
            await offlinedashboardPage.deviceSwitchingCloseButton.click();
        });

        await evoluClient.init({ ownerSecret });
        await evoluClient.expectInTable('account', []);
        await evoluClient.expectInTable('wallet', []);

        await offlineSuite.electronApp.close();

        const suiteRelaunch = await launchSuite({
            offlineMode: false,
            keepUserData: true,
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });

        enhancePage(suiteRelaunch.window);
        await suiteRelaunch.window.title();

        const devicePromptRelaunch = new DevicePrompt(suiteRelaunch.window, device);
        const metadataPageRelaunch = new MetadataPage(
            suiteRelaunch.window,
            device,
            new SettingsPage(suiteRelaunch.window, device),
            devicePromptRelaunch,
        );
        const walletPageRelaunch = new WalletPage(suiteRelaunch.window);
        const dashboardPageRelaunch = new DashboardPage(
            suiteRelaunch.window,
            device,
            devicePromptRelaunch,
        );

        await expect
            .soft(walletPageRelaunch.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }))
            .toHaveText(expectedAccount.label, { timeout: 30_000 });

        await dashboardPageRelaunch.openDeviceSwitcher();
        await expect
            .soft(metadataPageRelaunch.wallet.walletLabel(WALLET_INDEX))
            .toHaveText(expectedWallet.label);
        await dashboardPageRelaunch.deviceSwitchingCloseButton.click();

        //  find out how labels are persisted in the app and if they are persisted even in offline mode,
        //  then we can test if they are synced to relay after going online again

        await test.step('Verify data are sync to Relay', async () => {
            await evoluClient.init({ ownerSecret });
            await evoluClient.expectInTable('account', [expectedAccount], { softExpect: true });
            await evoluClient.expectInTable('wallet', [expectedWallet], { softExpect: true });
        });
    });
});
