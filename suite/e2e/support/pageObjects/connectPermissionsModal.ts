import { Locator, Page } from '@playwright/test';

export class ConnectPermissionsModal {
    readonly loadingHeader: Locator;
    readonly appName: Locator;
    readonly processParagraph: Locator;
    readonly rememberCheckbox: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        this.loadingHeader = page
            .getByTestId('@connect-popup-loading')
            .getByTestId('@modal/header');
        this.appName = page.getByTestId('@connect-permissions-modal/app-name');
        this.processParagraph = page.getByTestId('@connect-permissions-modal/paragraph-process');
        this.rememberCheckbox = page.getByTestId('@connect-permissions-modal/remember-checkbox');
        this.confirmButton = page.getByTestId('@connect-permissions-modal/confirm-button');
        this.cancelButton = page.getByTestId('@connect-permissions-modal/cancel-button');
    }
}
