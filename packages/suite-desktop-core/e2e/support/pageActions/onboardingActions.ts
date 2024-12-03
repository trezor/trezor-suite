import { Locator, Page, expect } from '@playwright/test';

export class OnboardingActions {
    readonly welcomeTitle: Locator;
    readonly analyticsHeading: Locator;
    readonly analyticsContinueButton: Locator;
    readonly onboardingContinueButton: Locator;
    readonly onboardingViewOnlySkipButton: Locator;
    readonly viewOnlyTooltipGotItButton: Locator;
    readonly connectDevicePrompt: Locator;

    constructor(public window: Page) {
        this.welcomeTitle = this.window.getByTestId('@welcome/title');
        this.analyticsHeading = this.window.getByTestId('@analytics/consent/heading');
        this.analyticsContinueButton = this.window.getByTestId('@analytics/continue-button');
        this.onboardingContinueButton = this.window.getByTestId('@onboarding/exit-app-button');
        this.onboardingViewOnlySkipButton = this.window.getByTestId('@onboarding/viewOnly/skip');
        this.viewOnlyTooltipGotItButton = this.window.getByTestId('@viewOnlyTooltip/gotIt');
        this.connectDevicePrompt = this.window.getByTestId('@connect-device-prompt');
    }

    async optionallyDismissFwHashCheckError() {
        await expect(this.welcomeTitle).toBeVisible({ timeout: 10000 });
        // dismisses the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        this.window
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    async completeOnboarding() {
        await this.optionallyDismissFwHashCheckError();
        await this.analyticsContinueButton.click();
        await this.onboardingContinueButton.click();
        await this.onboardingViewOnlySkipButton.click();
        await this.viewOnlyTooltipGotItButton.click();
    }
}
