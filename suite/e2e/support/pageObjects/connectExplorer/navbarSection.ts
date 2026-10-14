import { type Locator, type Page, expect } from '@playwright/test';

import { step } from '../../common';

/**
 * The navbar and the mobile sidebar each render their own copy of the search box, so the search
 * locators here are chained to the navbar.
 */
export class NavbarSection {
    readonly container: Locator;
    readonly logo: Locator;
    readonly hamburger: Locator;
    readonly searchInput: Locator;
    readonly searchResults: Locator;

    constructor(private readonly page: Page) {
        this.container = this.page.getByTestId('@explorer/navbar/container');
        this.logo = this.container.getByTestId('@navbar-logo');
        this.hamburger = this.container.getByTestId('@explorer/navbar/hamburger');
        this.searchInput = this.container.getByTestId('@explorer/search/input');
        this.searchResults = this.container.getByTestId('@explorer/search/results');
    }

    @step()
    async search(query: string) {
        await this.searchInput.fill(query);
        await expect(this.searchResults).toBeVisible();
    }

    @step()
    async openMobileMenu() {
        await this.hamburger.click();
    }

    @step()
    async getContainerBackgroundColor(): Promise<string> {
        return await this.container.evaluate(element => getComputedStyle(element).backgroundColor);
    }
}
