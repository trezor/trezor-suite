import { Locator, Page } from '@playwright/test';

import type { FeedbackCategory } from '@suite-common/feedback';
import { capitalizeFirstLetter } from '@trezor/utils';

import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

const anyTestIdEndingWithClose = '[data-testid$="close"]';

export class GuidePanel {
    readonly guideButton: Locator;
    readonly supportAndFeedbackButton: Locator;
    readonly bugFormButton: Locator;
    readonly feedbackFormButton: Locator;
    readonly bugLocationDropdown: Locator;
    readonly bugLocationDropdownInput: Locator;
    readonly bugLocationDropdownOption = (location: FeedbackCategory) =>
        this.page.getByTestId(`@guide/feedback/suggestion-dropdown/select/option/${location}`);
    readonly inputTextField: Locator;
    readonly submitButton: Locator;
    readonly closeButton: Locator;
    readonly guidePanel: Locator;
    readonly searchInput: Locator;
    readonly searchResults: Locator;
    readonly articleWithText = (text: string) =>
        this.page.locator(`[data-testid^="@guide/node"]`, { hasText: text });
    readonly toastNotifications: Locator;
    readonly feedbackSuccessToast: Locator;
    readonly guideNodes: Locator;
    readonly guideLabel: Locator;
    readonly searchNoResults: Locator;
    readonly backButton: Locator;
    readonly article: Locator;
    readonly articleImage: Locator;
    readonly articleImageModal: Locator;
    readonly articleImageCloseButton: Locator;
    readonly supportAppVersion: Locator;
    readonly supportFirmwareVersion: Locator;
    readonly category = (categoryId: string) =>
        this.page.getByTestId(`@guide/category/${categoryId}`);
    readonly node = (nodePath: string) => this.page.getByTestId(`@guide/node/${nodePath}`);
    readonly feedbackRating = (rating: number) =>
        this.page.getByTestId(`@guide/feedback/suggestion/${rating}`);

    constructor(private readonly page: Page) {
        this.guideButton = this.page.getByTestId('@guide/button-open');
        this.supportAndFeedbackButton = this.page.getByTestId('@guide/button-feedback');
        this.bugFormButton = this.page.getByTestId('@guide/feedback/bug');
        this.feedbackFormButton = this.page.getByTestId('@guide/feedback/suggestion');
        this.bugLocationDropdown = this.page.getByTestId('@guide/feedback/suggestion-dropdown');
        this.bugLocationDropdownInput = this.page.getByTestId(
            '@guide/feedback/suggestion-dropdown/select/input',
        );
        this.inputTextField = this.page.getByTestId('@guide/feedback/suggestion-form');
        this.submitButton = this.page.getByTestId('@guide/feedback/submit-button');
        this.closeButton = this.page.getByTestId('@guide/button-close');
        this.guidePanel = this.page.getByTestId('@guide/panel');
        this.searchInput = this.page.getByTestId('@guide/search');
        this.searchResults = this.page.getByTestId('@guide/search/results');
        this.toastNotifications = this.page.locator('[data-testid-alt="@toast"]');
        this.feedbackSuccessToast = this.page.getByTestId('@toast/user-feedback-send-success');
        this.guideNodes = this.page.getByTestId('@guide/nodes');
        this.guideLabel = this.page.getByTestId('@guide/label');
        this.searchNoResults = this.page.getByTestId('@guide/search/no-results');
        this.backButton = this.page.getByTestId('@guide/button-back');
        this.article = this.page.getByTestId('@guide/article');
        this.articleImage = this.page.getByTestId('@guide/article/image');
        this.articleImageModal = this.page.getByTestId('@guide/article/image-modal');
        this.articleImageCloseButton = this.page.getByTestId('@guide/article/image-close');
        this.supportAppVersion = this.page.getByTestId('@guide/support/app-version');
        this.supportFirmwareVersion = this.page.getByTestId('@guide/support/firmware-version');
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
        await this.inputTextField.fill(args.report);
        await this.submitButton.click();
    }

    @step()
    async closeAllToastNotifications() {
        for (const toast of await this.toastNotifications.all()) {
            await toast.locator(anyTestIdEndingWithClose).click();
            await expect(toast).toBeHidden();
        }
    }

    @step()
    async closeGuide() {
        //Toasts may obstruct Guide panel close button
        await this.closeAllToastNotifications();
        await this.closeButton.click();
        await expect(this.guidePanel).toBeHidden();
    }

    @step()
    async lookupArticle(article: string) {
        await this.searchInput.fill(article);
        await expect(this.searchResults).toBeVisible();
        await this.articleWithText(article).click();
    }

    @step()
    async sendFeedback(args: { rating: number; report: string }) {
        await this.feedbackFormButton.click();
        await this.feedbackRating(args.rating).click();
        await this.inputTextField.fill(args.report);
        await this.submitButton.click();
    }

    @step()
    async openArticleImageModal(locator: Locator) {
        await expect(locator).toHaveLoadedImage();
        await locator.click();
        await expect(this.articleImageModal).toBeVisible();
    }

    @step()
    async closeArticleImageModal() {
        await this.articleImageCloseButton.click();
        await expect(this.articleImageModal).toBeHidden();
    }
}
