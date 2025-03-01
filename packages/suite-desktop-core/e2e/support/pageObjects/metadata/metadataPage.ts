import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, step } from '../../common';
import { MetadataProvider } from '../../mocks/metadataMock';
import { DevicePrompt } from '../devicePrompt';
import { AccountMetadata } from './accountMetadata';
import { AddressMetadata } from './addressMetadata';
import { OutputMetadata } from './outputMetadata';
import { WalletMetadata } from './walletMetadata';

export class MetadataPage {
    readonly metadataModal: Locator;
    readonly account: AccountMetadata;
    readonly output: OutputMetadata;
    readonly wallet: WalletMetadata;
    readonly address: AddressMetadata;

    readonly metadataProviderButton = (provider: MetadataProvider) =>
        this.page.getByTestId(`@modal/metadata-provider/${provider}-button`);

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.metadataModal = page.getByTestId('@modal/metadata-provider');

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
        await TrezorUserEnvLinkProxy.pressYes();
        await this.metadataProviderButton(provider).click();

        if (options?.skipVerification) {
            return;
        }

        await expect(this.metadataModal).not.toBeVisible({
            timeout: 30000,
        });
    }
}
