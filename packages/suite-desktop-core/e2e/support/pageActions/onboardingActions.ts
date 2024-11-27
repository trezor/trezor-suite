import { Locator, Page, expect } from '@playwright/test';

export class OnboardingActions {
    private readonly window: Page;
    readonly welcomeTitle: Locator;
    readonly analyticsContinueButton: Locator;
    readonly onboardingContinueButton: Locator;
    readonly onboardingViewOnlySkipButton: Locator;
    readonly viewOnlyTooltipGotItButton: Locator;

    constructor(window: Page) {
        this.window = window;
        this.welcomeTitle = this.window.getByTestId('@welcome/title');
        this.analyticsContinueButton = this.window.getByTestId('@analytics/continue-button');
        this.onboardingContinueButton = this.window.getByTestId('@onboarding/exit-app-button');
        this.onboardingViewOnlySkipButton = this.window.getByTestId('@onboarding/viewOnly/skip');
        this.viewOnlyTooltipGotItButton = this.window.getByTestId('@viewOnlyTooltip/gotIt');
    }

    optionallyDismissFwHashCheckError() {
        // dismisses the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        this.window
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    async completeOnboarding() {
        await expect(this.welcomeTitle).toBeVisible();
        this.optionallyDismissFwHashCheckError();
        await this.analyticsContinueButton.click();
        await this.onboardingContinueButton.click();
        await this.onboardingViewOnlySkipButton.click();
        await this.viewOnlyTooltipGotItButton.click();
    }
}
