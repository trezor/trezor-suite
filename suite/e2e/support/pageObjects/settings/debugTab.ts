import { Locator, Page } from '@playwright/test';

export class DebugTab {
    readonly suiteSyncCheckbox: Locator;
    readonly suiteSyncUrlInput: Locator;
    readonly suiteSyncUrlSaveButton: Locator;

    constructor(readonly page: Page) {
        this.suiteSyncCheckbox = page.getByTestId('@settings/debug/suite-sync/checkbox');
        this.suiteSyncUrlInput = page.getByTestId('@settings/debug/suite-sync/relay-url-input');
        this.suiteSyncUrlSaveButton = page.getByTestId('@settings/debug/suite-sync/save-button');
    }
}
