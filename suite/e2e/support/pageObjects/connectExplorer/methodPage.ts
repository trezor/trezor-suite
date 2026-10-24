import { type Locator, type Page, expect } from '@playwright/test';

import { step } from '../../common';

const CONTENT_HEADING = /^@explorer\/content\/heading\//;
const TOC_ENTRY = /^@explorer\/toc\/entry\//;

/**
 * A documentation page of the explorer: its headings, its table of contents and the shell of the
 * method testing tool. Nothing here submits a Connect call.
 */
export class MethodPage {
    readonly title: Locator;
    readonly headings: Locator;
    readonly tocContainer: Locator;
    readonly tocList: Locator;
    readonly tocEntries: Locator;
    readonly codeBlocks: Locator;
    readonly paramsTables: Locator;
    readonly playgroundBox: Locator;
    readonly playgroundParams: Locator;
    readonly submitButton: Locator;
    readonly subMethodSelect: Locator;
    readonly heading = (id: string): Locator =>
        this.page.getByTestId(`@explorer/content/heading/${id}`);
    readonly tocEntry = (id: string): Locator => this.page.getByTestId(`@explorer/toc/entry/${id}`);

    constructor(private readonly page: Page) {
        this.title = this.page.getByTestId('@explorer/content/title');
        this.headings = this.page.getByTestId(CONTENT_HEADING);
        this.tocContainer = this.page.getByTestId('@explorer/toc/container');
        this.tocList = this.tocContainer.getByTestId('@explorer/toc/list');
        this.tocEntries = this.tocContainer.getByTestId(TOC_ENTRY);
        this.codeBlocks = this.page.getByTestId('@explorer/content/code-block');
        this.paramsTables = this.page.getByTestId('@explorer/content/table');
        this.playgroundBox = this.page.getByTestId('@api-playground/collapsible-box');
        this.playgroundParams = this.page.getByTestId('@explorer/playground/params');
        this.submitButton = this.page.getByTestId('@submit-button');
        this.subMethodSelect = this.page.getByTestId('@explorer/playground/method-select/input');
    }

    @step()
    async expandPlayground() {
        await this.playgroundBox.click();
        await expect(this.playgroundParams).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }

    /** Anchor ids of the headings the page actually rendered, in document order. */
    @step()
    async getRenderedHeadingIds(): Promise<string[]> {
        await expect(this.headings).not.toHaveCount(0);

        return await this.getTestIdSuffixes(this.headings);
    }

    /** Anchor ids the table of contents links to, in document order. */
    @step()
    async getTocEntryIds(): Promise<string[]> {
        return await this.getTestIdSuffixes(this.tocEntries);
    }

    @step()
    async getScrollPosition(): Promise<number> {
        return await this.page.evaluate(() => window.scrollY);
    }

    private async getTestIdSuffixes(locator: Locator): Promise<string[]> {
        const elements = await locator.all();
        const testIds = await Promise.all(
            elements.map(element => element.getAttribute('data-testid')),
        );

        return testIds
            .filter((testId): testId is string => !!testId)
            .map(testId => testId.slice(testId.lastIndexOf('/') + 1));
    }
}
