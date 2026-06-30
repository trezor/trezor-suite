import { Locator, Page } from '@playwright/test';

export class ConnectSelectAccountModal {
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;
    readonly closeButton: Locator;
    readonly prevPage: Locator;
    readonly nextPage: Locator;
    readonly pageInput: Locator;

    constructor(private readonly page: Page) {
        this.confirmButton = page.getByTestId('@connect-select-account/confirm-button');
        this.cancelButton = page.getByTestId('@connect-select-account/cancel-button');
        this.closeButton = page.getByTestId('@connect-select-account/close-button');
        this.prevPage = page.getByTestId('@connect-select-account/prev-page');
        this.nextPage = page.getByTestId('@connect-select-account/next-page');
        this.pageInput = page.getByTestId('@connect-select-account/page-input');
    }

    account(index: number): Locator {
        return this.page.getByTestId(`@connect-select-account/account/${index}`);
    }

    checkbox(index: number): Locator {
        return this.page.getByTestId(`@connect-select-account/checkbox/${index}`);
    }

    verifyButton(index: number): Locator {
        return this.page.getByTestId(`@connect-select-account/verify-button/${index}`);
    }

    verifiedBadge(index: number): Locator {
        return this.page.getByTestId(`@connect-select-account/verified-badge/${index}`);
    }

    errorBadge(index: number): Locator {
        return this.page.getByTestId(`@connect-select-account/error-badge/${index}`);
    }
}
