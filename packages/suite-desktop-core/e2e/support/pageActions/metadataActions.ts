import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { MetadataProvider } from '../metadataProviderMocks';
import { DevicePromptActions } from './devicePromptActions';
import { step } from '../common';

export class MetadataActions {
    private readonly metadataSubmitButton: Locator;
    readonly metadataInput: Locator;
    readonly editLabelButton = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/edit-label-button`);
    readonly successLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/success`);
    readonly accountLabel = (accountId: string) =>
        this.page.getByTestId(this.getAccountLabelTestId(accountId));

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePromptActions,
    ) {
        this.metadataSubmitButton = page.getByTestId('@metadata/submit');
        this.metadataInput = page.getByTestId('@metadata/input');
    }

    private getAccountLabelTestId(accountId: string): string {
        return `@metadata/accountLabel/${accountId}`;
    }

    @step()
    async passThroughInitMetadata(provider: MetadataProvider) {
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();
        await this.page.getByTestId(`@modal/metadata-provider/${provider}-button`).click();
        await expect(this.page.getByTestId('@modal/metadata-provider')).not.toBeVisible({
            timeout: 30000,
        });
    }

    @step()
    async hoverAccountLabel(accountId: string) {
        await this.page
            .getByTestId(`${this.getAccountLabelTestId(accountId)}/hover-container`)
            .hover();
    }

    @step()
    async editLabel(accountId: string, newLabel: string) {
        await this.accountLabel(accountId).click();
        await this.editLabelButton(accountId).click();
        await this.metadataInput.fill(newLabel);
        await this.metadataSubmitButton.click();
    }

    @step()
    async clickAddLabelButton(accountId: string) {
        await this.hoverAccountLabel(accountId);
        await this.page
            .getByTestId(`${this.getAccountLabelTestId(accountId)}/add-label-button`)
            .click();
    }

    @step()
    async addLabel(accountId: string, label: string) {
        await this.clickAddLabelButton(accountId);
        await this.metadataInput.fill(label);
        await this.page.keyboard.press('Enter');
    }
}
