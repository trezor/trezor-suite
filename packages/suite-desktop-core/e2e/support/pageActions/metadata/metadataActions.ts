import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { MetadataProvider } from '../../mocks/metadataProviderMock';
import { DevicePromptActions } from '../devicePromptActions';
import { step } from '../../common';
import { AccountMetadataActions } from './accountMetadataActions';
import { OutputMetadataActions } from './outputMetadataActions';
import { WalletMetadataActions } from './walletMetadataActions';
import { AddressMetadataActions } from './addressMetadataActions';

export class MetadataActions {
    readonly metadataModal: Locator;
    readonly account: AccountMetadataActions;
    readonly output: OutputMetadataActions;
    readonly wallet: WalletMetadataActions;
    readonly address: AddressMetadataActions;

    readonly metadataProviderButton = (provider: MetadataProvider) =>
        this.page.getByTestId(`@modal/metadata-provider/${provider}-button`);

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePromptActions,
    ) {
        this.metadataModal = page.getByTestId('@modal/metadata-provider');

        this.account = new AccountMetadataActions(page);
        this.output = new OutputMetadataActions(page);
        this.wallet = new WalletMetadataActions(page);
        this.address = new AddressMetadataActions(page);
    }

    @step()
    async passThroughInitMetadata(
        provider: MetadataProvider,
        options?: { skipVerification?: boolean },
    ) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();
        await this.metadataProviderButton(provider).click();

        if (options?.skipVerification) {
            return;
        }

        await expect(this.metadataModal).not.toBeVisible({
            timeout: 30000,
        });
    }
}
