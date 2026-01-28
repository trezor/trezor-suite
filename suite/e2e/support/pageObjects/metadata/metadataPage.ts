import { Locator, Page, expect } from '@playwright/test';

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
    readonly metadataModal: Locator;
    readonly copyAddressButton: Locator;
    readonly account: AccountMetadata;
    readonly output: OutputMetadata;
    readonly wallet: WalletMetadata;
    readonly address: AddressMetadata;

    readonly metadataProviderButton = (provider: MetadataProvider) =>
        this.page.getByTestId(`@modal/metadata-provider/${provider}-button`);

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
        private readonly settingsPage: SettingsPage,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.metadataModal = page.getByTestId('@modal/metadata-provider');
        this.copyAddressButton = page.getByTestId('@metadata/copy-address-button');

        this.account = new AccountMetadata(page);
        this.output = new OutputMetadata(page);
        this.wallet = new WalletMetadata(page);
        this.address = new AddressMetadata(page);
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
        await this.settingsPage.navigateTo('debug');
        await this.settingsPage.debugTab.suiteSyncCheckbox.click();
        await this.settingsPage.debugTab.suiteSyncUrlInput.fill('http://127.0.0.1:4000');
        await this.settingsPage.debugTab.suiteSyncUrlSaveButton.click();

        await this.settingsPage.navigateTo('application');
        await this.page.selectDropdownOptionWithRetry(
            this.settingsPage.metadataSelectInput,
            this.settingsPage.metadataSelectInputOption('suite-sync'),
        );
    }

    @step()
    async confirmSuiteSyncSetup() {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        // wait before closing the modal to prevent "Trezor Sync key retrieval failed" error
        await this.page.waitForTimeout(2000);
    }

    @step()
    async enableSuiteSync() {
        await this.initiateSuiteSyncSetup();
        await this.confirmSuiteSyncSetup();
    }

    @step()
    async setupQuotaManager() {
        await this.settingsPage.navigateTo('debug');
        await this.settingsPage.debugTab.quotaManagerCheckbox.click();
        await this.settingsPage.debugTab.quotaManagerUrlInput.fill('http://127.0.0.1:4001');
        await this.settingsPage.debugTab.quotaManagerUrlSaveButton.click();
    }
}
