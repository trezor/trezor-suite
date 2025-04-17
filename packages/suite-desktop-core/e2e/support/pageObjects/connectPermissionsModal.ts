import { Locator, Page } from '@playwright/test';

export class ConnectPermissionsModal {
    readonly loadingHeader: Locator;
    readonly processParagraph: Locator;
    readonly rememberCheckbox: Locator;
    readonly confirmButton: Locator;

    constructor(page: Page) {
        this.loadingHeader = page
            .getByTestId('@connect-popup-loading')
            .getByTestId('@modal/header');
        this.processParagraph = page.getByTestId('@connect-popup-modal/paragraph-process');
        this.rememberCheckbox = page.getByTestId('@connect-popup-modal/remember-checkbox');
        this.confirmButton = page.getByTestId('@modal').getByRole('button', { name: 'Confirm' });
    }
}
