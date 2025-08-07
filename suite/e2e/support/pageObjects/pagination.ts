import { Locator, Page, expect } from '@playwright/test';

export class PaginationControl {
    readonly page: Page;
    readonly goToNextPage: Locator;
    readonly goToPreviousPage: Locator;
    readonly pageButtonSelector = (pageNumber: number) =>
        this.page.getByTestId(`@wallet/accounts/pagination/${pageNumber}`);
    readonly transactionAddress = (id: string) =>
        this.page
            .getByTestId(`@metadata/outputLabel/${id}/hover-container`)
            .getByTestId('@wallet/transaction/target-address');

    constructor(page: Page) {
        this.page = page;
        this.goToNextPage = page.getByTestId('@wallet/pagination/go-to-next-page-button');
        this.goToPreviousPage = page.getByTestId('@wallet/pagination/go-to-previous-page-button');
    }

    async goToPageViaInput(pageNumber: string) {
        const goToPageInput = this.page.getByTestId('@wallet/pagination/go-to-page-input');
        const goToPageButton = this.page.getByTestId('@wallet/pagination/go-to-page-button');

        await goToPageInput.fill(pageNumber);
        await goToPageButton.click();
    }

    async checkIfPageIsActive(pageNumber: number) {
        const pageButton = this.pageButtonSelector(pageNumber);
        await expect(pageButton).toHaveAttribute('data-test-activated', 'true');
    }

    async checkIfPageIsInactive(pageNumber: number) {
        const pageButton = this.pageButtonSelector(pageNumber);
        await expect(pageButton).toHaveAttribute('data-test-activated', 'false');
    }
}
