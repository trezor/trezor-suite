import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { MetadataProvider } from '../mocks/metadataProviderMock';
import { DevicePromptActions } from './devicePromptActions';
import { step } from '../common';

interface MetadataSubmitOptions {
    useButton?: boolean;
}

export class MetadataActions {
    private readonly metadataSubmitButton: Locator;
    readonly metadataCancelButton: Locator;
    readonly metadataInput: Locator;
    readonly metadataModal: Locator;

    readonly addAccountLabelButton = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/add-label-button`);
    readonly editAccountLabelButton = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/edit-label-button`);
    readonly successAccountLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/success`);
    readonly accountLabel = (accountId: string) =>
        this.page.getByTestId(`${this.getAccountLabelTestId(accountId)}/hover-container`);
    readonly outputLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(`${this.getOutputLabelTestId(outputId, txNumber)}/hover-container`);
    readonly outputDropdownCopyAddress = (outputId: string, txNumber: number) =>
        this.page.getByTestId(
            `${this.getOutputLabelTestId(outputId, txNumber)}/dropdown/copy-address`,
        );
    readonly outputDropdownEditLabel = (outputId: string, txNumber: number) =>
        this.page.getByTestId(
            `${this.getOutputLabelTestId(outputId, txNumber)}/dropdown/edit-label`,
        );
    readonly metadataProviderButton = (provider: MetadataProvider) =>
        this.page.getByTestId(`@modal/metadata-provider/${provider}-button`);

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePromptActions,
    ) {
        this.metadataSubmitButton = page.getByTestId('@metadata/submit');
        this.metadataCancelButton = page.getByTestId('@metadata/cancel');
        this.metadataInput = page.getByTestId('@metadata/input');
        this.metadataModal = page.getByTestId('@modal/metadata-provider');
    }

    private getAccountLabelTestId(accountId: string): string {
        return `@metadata/accountLabel/${accountId}`;
    }

    private getOutputLabelTestId(outputId: string, txNumber: number): string {
        return `@metadata/outputLabel/${outputId}-${txNumber}`;
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

    @step()
    async editAccountLabel(accountId: string, newLabel: string) {
        await this.accountLabel(accountId).click();
        await this.editAccountLabelButton(accountId).click();
        await this.fillLabelInput(newLabel, { useButton: true });
    }

    @step()
    async clickAddAccountLabelButton(accountId: string) {
        await this.accountLabel(accountId).hover();
        await this.addAccountLabelButton(accountId).click();
    }

    @step()
    async addAccountLabel(accountId: string, label: string) {
        await this.clickAddAccountLabelButton(accountId);
        await this.fillLabelInput(label);
    }

    @step()
    async clickAddOutputLabelButton(outputId: string, txNumber: number) {
        await this.outputLabel(outputId, txNumber).hover();
        await this.page
            .getByTestId(`${this.getOutputLabelTestId(outputId, txNumber)}/add-label-button`)
            .click();
    }

    @step()
    async addOutputLabel(outputId: string, txNumber: number, label: string) {
        await this.clickAddOutputLabelButton(outputId, txNumber);
        await this.fillLabelInput(label);
    }

    @step()
    async editOutputLabel(outputId: string, txNumber: number, newLabel: string) {
        await this.outputLabel(outputId, txNumber).click();
        await this.outputDropdownEditLabel(outputId, txNumber).click();
        await this.fillLabelInput(newLabel);
    }

    @step()
    async fillLabelInput(label: string, options?: MetadataSubmitOptions) {
        await this.metadataInput.fill(label);

        if (options?.useButton) {
            await this.metadataSubmitButton.click();

            return;
        }

        await this.page.keyboard.press('Enter');
    }
}
