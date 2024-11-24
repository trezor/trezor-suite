import { Page, expect } from '@playwright/test';

import { waitForDataTestSelector } from '../common';

export class SuiteGuide {
    private readonly window: Page;
    constructor(window: Page) {
        this.window = window;
    }

    async openSidePanel() {
        await this.window.getByTestId('@guide/button-open').click();
        await waitForDataTestSelector(this.window, '@guide/panel');
    }

    async openFeedback() {
        await this.window.getByTestId('@guide/button-feedback').click();
    }

    async openDesiredForm(formType: string) {
        const bugDropdown = await this.window.getByTestId(`@guide/feedback/${formType}`);
        await bugDropdown.waitFor({ state: 'visible' });
        await bugDropdown.click();
    }

    async selectLocationInApp(desiredLocation: string) {
        const suggestionDropdown = this.window.getByTestId('@guide/feedback/suggestion-dropdown');
        await suggestionDropdown.waitFor({ state: 'visible' });
        await suggestionDropdown.click();
        await this.window
            .getByTestId(
                `@guide/feedback/suggestion-dropdown/select/option/${desiredLocation.toLowerCase()}`,
            )
            .click();
        // assert that select value was changed correctly.
        expect(
            this.window.locator('[data-testid="@guide/feedback/suggestion-dropdown/select/input"]'),
        ).toHaveText(desiredLocation);
    }

    async fillInSuggestionForm(reportText: string) {
        // stability necesity
        await this.window.waitForTimeout(250);
        const suggestionForm = await this.window.getByTestId('@guide/feedback/suggestion-form');
        await suggestionForm.fill(reportText);
    }

    async submitForm() {
        const submitButton = await this.window.getByTestId('@guide/feedback/submit-button');
        await expect(submitButton).toBeEnabled({ timeout: 20000 });
        await submitButton.click();
    }

    async sendBugreport({
        reportText,
        desiredLocation,
    }: {
        desiredLocation: string;
        reportText: string;
    }) {
        await this.openDesiredForm('bug');
        await this.selectLocationInApp(desiredLocation);
        await this.fillInSuggestionForm(reportText);
        await this.submitForm();
    }

    async closeGuide() {
        // since there's a possibility of a notification, we first check for it
        const suiteNotification = await this.window.locator('[data-testid*="@toast"]').first();
        if (await suiteNotification.isVisible()) {
            await suiteNotification.locator('[data-testid$="close"]').click();
            await suiteNotification.waitFor({ state: 'detached' });
        }
        await this.window.getByTestId('@guide/button-close').click();
        await this.window.getByTestId('@guide/panel').waitFor({ state: 'detached' });
    }

    async lookupArticle(article: string) {
        await this.window.getByTestId('@guide/search').fill(article);
        await this.window.getByTestId('@guide/search/results').waitFor({ state: 'visible' });
        await this.window.locator('[data-testid^="@guide/node"]', { hasText: article }).click();
    }

    // asserts
    async getSuccessToast() {
        return (
            (await waitForDataTestSelector(this.window, '@toast/user-feedback-send-success')) ??
            true
        );
    }

    getArticleHeader() {
        return this.window.locator('[class^="GuideContent"]').locator('h1');
    }
}
