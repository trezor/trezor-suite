import { Locator, Page, expect } from '@playwright/test';

import { FeedbackCategory } from '@suite-common/suite-types';
import { capitalizeFirstLetter } from '@trezor/utils';

const anyTestIdEndingWithClose = '[data-testid$="close"]';

export class SuiteGuide {
    private readonly window: Page;
    readonly guideButton: Locator;
    readonly supportAndFeedbackButton: Locator;
    readonly bugFormButton: Locator;
    readonly feedbackFormButton: Locator;
    readonly bugLocationDropdown: Locator;
    readonly bugLocationDropdownInput: Locator;
    readonly bugLocationDropdownOption = (location: FeedbackCategory) =>
        this.window.getByTestId(`@guide/feedback/suggestion-dropdown/select/option/${location}`);
    readonly bugInputTextField: Locator;
    readonly submitButton: Locator;
    readonly closeButton: Locator;
    readonly guidePanel: Locator;
    readonly searchInput: Locator;
    readonly searchResults: Locator;
    readonly articleWithText = (text: string) =>
        this.window.locator(`[data-testid^="@guide/node"]`, { hasText: text });
    readonly toastNotifications: Locator;
    readonly feedbackSuccessToast: Locator;
    readonly articleHeader: Locator;

    constructor(window: Page) {
        this.window = window;
        this.guideButton = this.window.getByTestId('@guide/button-open');
        this.supportAndFeedbackButton = this.window.getByTestId('@guide/button-feedback');
        this.bugFormButton = this.window.getByTestId('@guide/feedback/bug');
        this.feedbackFormButton = this.window.getByTestId('@guide/feedback/suggestion');
        this.bugLocationDropdown = this.window.getByTestId('@guide/feedback/suggestion-dropdown');
        this.bugLocationDropdownInput = this.window.getByTestId(
            '@guide/feedback/suggestion-dropdown/select/input',
        );
        this.bugInputTextField = this.window.getByTestId('@guide/feedback/suggestion-form');
        this.submitButton = this.window.getByTestId('@guide/feedback/submit-button');
        this.closeButton = this.window.getByTestId('@guide/button-close');
        this.guidePanel = this.window.getByTestId('@guide/panel');
        this.searchInput = this.window.getByTestId('@guide/search');
        this.searchResults = this.window.getByTestId('@guide/search/results');
        this.toastNotifications = this.window.locator('[data-testid-alt="@toast"]');
        this.feedbackSuccessToast = this.window.getByTestId('@toast/user-feedback-send-success');
        this.articleHeader = this.window.getByTestId('@guide/article').locator('h1');
    }

    async openPanel() {
        await this.guideButton.click();
        await expect(this.guidePanel).toBeVisible();
    }

    async selectBugLocation(location: FeedbackCategory) {
        await this.bugLocationDropdown.click();
        await this.bugLocationDropdownOption(location).click();
        await expect(this.bugLocationDropdownInput).toHaveText(capitalizeFirstLetter(location));
    }

    async sendBugReport(args: { location: FeedbackCategory; report: string }) {
        await this.bugFormButton.click();
        await this.selectBugLocation(args.location);
        // stability necessity
        await this.window.waitForTimeout(250);
        await this.bugInputTextField.fill(args.report);
        await this.submitButton.click();
    }

    async closeAllToastNotifications() {
        for (const toast of await this.toastNotifications.all()) {
            await toast.locator(anyTestIdEndingWithClose).click();
            await toast.waitFor({ state: 'detached' });
        }
    }

    async closeGuide() {
        //Toasts may obstruct Guide panel close button
        await this.closeAllToastNotifications();
        await this.closeButton.click();
        await this.guidePanel.waitFor({ state: 'detached' });
    }

    async lookupArticle(article: string) {
        await this.searchInput.fill(article);
        await expect(this.searchResults).toBeVisible();
        await this.articleWithText(article).click();
    }
}
