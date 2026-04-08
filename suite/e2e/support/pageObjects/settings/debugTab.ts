import { Locator, Page, expect } from '@playwright/test';

import { getPromoBannerJsonContent } from '../../../fixtures/promoBannerFixture';
import { step } from '../../common';
import { PromoBannerType } from '../dashboardPage';

export class DebugTab {
    readonly suiteSyncUrlInput: Locator;
    readonly suiteSyncUrlSaveButton: Locator;
    readonly modal: Locator;
    readonly modalCloseButton: Locator;
    readonly messageManagerButton: Locator;
    readonly addNewMessageButton: Locator;
    readonly jsonEditor: Locator;
    readonly addMessageButton: Locator;
    readonly quotaManagerUrlInput: Locator;
    readonly quotaManagerUrlSaveButton: Locator;
    readonly quotaManagerEnforceCheckbox: Locator;

    constructor(private readonly page: Page) {
        this.suiteSyncUrlInput = page.getByTestId('@settings/debug/suite-sync/server-url-input');
        this.suiteSyncUrlSaveButton = page.getByTestId('@settings/debug/suite-sync/save-button');
        this.modal = page.getByTestId('@modal');
        this.modalCloseButton = page.getByTestId('@modal/close-button');
        this.messageManagerButton = page.getByTestId(
            '@settings/debug/message-system/message-manager-button',
        );
        this.addNewMessageButton = page.getByTestId(
            '@settings/debug/message-system/add-new-message-button',
        );
        this.jsonEditor = page.getByTestId('@settings/debug/message-system/json-editor-textarea');
        this.addMessageButton = page.getByTestId(
            '@settings/debug/message-system/json-editor-add-message-button',
        );
        this.quotaManagerUrlInput = page.getByTestId('@settings/debug/quota-manager-url-input');
        this.quotaManagerUrlSaveButton = page.getByTestId(
            '@settings/debug/quota-manager-url-save-button',
        );
        this.quotaManagerEnforceCheckbox = page.getByTestId(
            '@settings/debug/quota-manager-enforce-for-custom-server-checkbox',
        );
    }

    @step()
    async addBanner(bannerType: PromoBannerType) {
        const messageId = crypto.randomUUID();
        const jsonContent = getPromoBannerJsonContent(messageId, bannerType);

        await this.messageManagerButton.click();
        await this.addNewMessageButton.click();

        await this.jsonEditor.focus();
        await this.jsonEditor.fill(jsonContent);
        await this.addMessageButton.click();

        await expect(this.page.getByText(messageId, { exact: true })).toBeAttached();

        await this.modalCloseButton.click();

        await expect(this.modal).toBeHidden();
    }
}
