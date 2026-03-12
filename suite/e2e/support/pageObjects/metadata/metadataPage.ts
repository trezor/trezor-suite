import { Locator, Page, expect } from '@playwright/test';

import { QUOTA_URL, RELAY_URL } from '@suite-common/e2e-evolu-client';

import { step } from '../../common';
import { MetadataProvider } from '../../mocks/metadataMock';
import { DevicePrompt } from '../devicePrompt';
import { AccountMetadata } from './accountMetadata';
import { AddressMetadata } from './addressMetadata';
import { OutputMetadata } from './outputMetadata';
import { WalletMetadata } from './walletMetadata';
import { DeviceFixture } from '../../device';
import { SettingsPage } from '../settings/settingsPage';

export class MetadataPage {
    readonly account: AccountMetadata;
    readonly output: OutputMetadata;
    readonly wallet: WalletMetadata;
    readonly address: AddressMetadata;

    readonly metadataModal: Locator;
    readonly copyAddressButton: Locator;
    readonly suiteSyncBanner: Locator;
    readonly suiteSyncBannerButton: Locator;
    readonly metadataProviderButton = (provider: MetadataProvider) =>
        this.page.getByTestId(`@modal/metadata-provider/${provider}-button`);

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
        private readonly settingsPage: SettingsPage,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.account = new AccountMetadata(page);
        this.output = new OutputMetadata(page);
        this.wallet = new WalletMetadata(page);
        this.address = new AddressMetadata(page);

        this.metadataModal = page.getByTestId('@modal/metadata-provider');
        this.copyAddressButton = page.getByTestId('@metadata/copy-address-button');
        this.suiteSyncBanner = page.getByTestId('@notification/suite-sync-keys');
        this.suiteSyncBannerButton = page.getByTestId('@notification/suite-sync-keys/button');
    }

    @step()
    async passThroughInitMetadata(
        provider: MetadataProvider,
        options?: { skipVerification?: boolean },
    ) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        await this.metadataProviderButton(provider).click();

        if (options?.skipVerification) {
            return;
        }

        await expect(this.metadataModal).not.toBeVisible({
            timeout: 30000,
        });
    }

    @step()
    async initiateSuiteSyncSetup() {
        // Enable Suite Sync in Experimental Features
        await this.settingsPage.navigateTo('application');
        await this.settingsPage.experimentalFeaturesSwitch.click();
        await this.settingsPage.suiteSyncCheckbox.click();

        // Configure Suite Sync relay and quota manager URLs in Debug settings
        await this.settingsPage.navigateTo('debug');
        await this.settingsPage.debugTab.suiteSyncUrlInput.fill(RELAY_URL);
        await this.settingsPage.debugTab.suiteSyncUrlSaveButton.click();
        await this.settingsPage.debugTab.quotaManagerUrlInput.fill(QUOTA_URL);
        await this.settingsPage.debugTab.quotaManagerUrlSaveButton.click();

        // Select Suite Sync as the labeling method
        await this.settingsPage.navigateTo('application');
        await this.page.selectDropdownOptionWithRetry(
            this.settingsPage.metadataSelectInput,
            this.settingsPage.metadataSelectInputOption('suite-sync'),
        );
    }

    @step()
    async confirmSuiteSyncSetup() {
        await this.device.expectToContainOnDisplay('Sync');
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        // wait before closing the modal to prevent "Trezor Sync key retrieval failed" error
        await this.page.waitForTimeout(2_000);
    }

    @step()
    async enableSuiteSync() {
        await this.initiateSuiteSyncSetup();
        await this.confirmSuiteSyncSetup();
    }

    @step()
    async setupQuotaManager() {
        await this.settingsPage.navigateTo('debug');
        await this.settingsPage.debugTab.quotaManagerUrlInput.fill(QUOTA_URL);
        await this.settingsPage.debugTab.quotaManagerUrlSaveButton.click();
    }
}
