import { Locator, Page, expect } from '@playwright/test';

import { FeedbackCategory } from '@suite-common/suite-types';
import { capitalizeFirstLetter } from '@trezor/utils';

import { step } from '../common';

const anyTestIdEndingWithClose = '[data-testid$="close"]';

export class SuiteGuide {
    readonly guideButton: Locator;
    readonly supportAndFeedbackButton: Locator;
    readonly bugFormButton: Locator;
    readonly feedbackFormButton: Locator;
    readonly bugLocationDropdown: Locator;
    readonly bugLocationDropdownInput: Locator;
    readonly bugLocationDropdownOption = (location: FeedbackCategory) =>
        this.page.getByTestId(`@guide/feedback/suggestion-dropdown/select/option/${location}`);
    readonly bugInputTextField: Locator;
    readonly submitButton: Locator;
    readonly closeButton: Locator;
    readonly guidePanel: Locator;
    readonly searchInput: Locator;
    readonly searchResults: Locator;
    readonly articleWithText = (text: string) =>
        this.page.locator(`[data-testid^="@guide/node"]`, { hasText: text });
    readonly toastNotifications: Locator;
    readonly feedbackSuccessToast: Locator;
    readonly articleHeader: Locator;

    constructor(private readonly page: Page) {
        this.guideButton = this.page.getByTestId('@guide/button-open');
        this.supportAndFeedbackButton = this.page.getByTestId('@guide/button-feedback');
        this.bugFormButton = this.page.getByTestId('@guide/feedback/bug');
        this.feedbackFormButton = this.page.getByTestId('@guide/feedback/suggestion');
        this.bugLocationDropdown = this.page.getByTestId('@guide/feedback/suggestion-dropdown');
        this.bugLocationDropdownInput = this.page.getByTestId(
            '@guide/feedback/suggestion-dropdown/select/input',
        );
        this.bugInputTextField = this.page.getByTestId('@guide/feedback/suggestion-form');
        this.submitButton = this.page.getByTestId('@guide/feedback/submit-button');
        this.closeButton = this.page.getByTestId('@guide/button-close');
        this.guidePanel = this.page.getByTestId('@guide/panel');
        this.searchInput = this.page.getByTestId('@guide/search');
        this.searchResults = this.page.getByTestId('@guide/search/results');
        this.toastNotifications = this.page.locator('[data-testid-alt="@toast"]');
        this.feedbackSuccessToast = this.page.getByTestId('@toast/user-feedback-send-success');
        this.articleHeader = this.page.getByTestId('@guide/article').locator('h1');
    }

    @step()
    async openPanel() {
        await this.guideButton.click();
        await expect(this.guidePanel).toBeVisible();
    }

    @step()
    async selectBugLocation(location: FeedbackCategory) {
        await this.bugLocationDropdown.click();
        await this.bugLocationDropdownOption(location).click();
        await expect(this.bugLocationDropdownInput).toHaveText(capitalizeFirstLetter(location));
    }

    @step()
    async sendBugReport(args: { location: FeedbackCategory; report: string }) {
        await this.bugFormButton.click();
        await this.selectBugLocation(args.location);
        // stability necessity
        await this.page.waitForTimeout(250);
        await this.bugInputTextField.fill(args.report);
        await this.submitButton.click();
    }

    @step()
    async closeAllToastNotifications() {
        for (const toast of await this.toastNotifications.all()) {
            await toast.locator(anyTestIdEndingWithClose).click();
            await toast.waitFor({ state: 'detached' });
        }
    }

    @step()
    async closeGuide() {
        //Toasts may obstruct Guide panel close button
        await this.closeAllToastNotifications();
        await this.closeButton.click();
        await this.guidePanel.waitFor({ state: 'detached' });
    }

    @step()
    async lookupArticle(article: string) {
        await this.searchInput.fill(article);
        await expect(this.searchResults).toBeVisible();
        await this.articleWithText(article).click();
    }
}
