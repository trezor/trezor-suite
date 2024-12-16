import { Locator, Page, TestInfo, expect } from '@playwright/test';

import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { SUITE as SuiteActions } from '@trezor/suite/src/actions/suite/constants';

import { PlaywrightProjects } from '../../playwright.config';

export class OnboardingActions {
    readonly model: Model;
    readonly testInfo: TestInfo;
    readonly welcomeTitle: Locator;
    readonly analyticsHeading: Locator;
    readonly analyticsContinueButton: Locator;
    readonly onboardingContinueButton: Locator;
    readonly onboardingViewOnlySkipButton: Locator;
    readonly onboardingViewOnlyEnableButton: Locator;
    readonly viewOnlyTooltipGotItButton: Locator;
    readonly connectDevicePrompt: Locator;
    readonly authenticityStartButton: Locator;
    readonly authenticityContinueButton: Locator;
    isModelWithSecureElement = () => ['T2B1', 'T3T1'].includes(this.model);

    constructor(
        public page: Page,
        model: Model,
        testInfo: TestInfo,
    ) {
        this.model = model;
        this.testInfo = testInfo;
        this.welcomeTitle = this.page.getByTestId('@welcome/title');
        this.analyticsHeading = this.page.getByTestId('@analytics/consent/heading');
        this.analyticsContinueButton = this.page.getByTestId('@analytics/continue-button');
        this.onboardingContinueButton = this.page.getByTestId('@onboarding/exit-app-button');
        this.onboardingViewOnlySkipButton = this.page.getByTestId('@onboarding/viewOnly/skip');
        this.onboardingViewOnlyEnableButton = this.page.getByTestId('@onboarding/viewOnly/enable');
        this.viewOnlyTooltipGotItButton = this.page.getByTestId('@viewOnlyTooltip/gotIt');
        this.connectDevicePrompt = this.page.getByTestId('@connect-device-prompt');
        this.authenticityStartButton = this.page.getByTestId('@authenticity-check/start-button');
        this.authenticityContinueButton = this.page.getByTestId(
            '@authenticity-check/continue-button',
        );
    }

    async optionallyDismissFwHashCheckError() {
        await expect(this.welcomeTitle).toBeVisible({ timeout: 10000 });
        // dismisses the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        this.page
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    async completeOnboarding({ enableViewOnly = false } = {}) {
        if (this.testInfo.project.name === PlaywrightProjects.Web) {
            await this.disableFirmwareHashCheck();
        }
        await this.optionallyDismissFwHashCheckError();
        await this.analyticsContinueButton.click();
        await this.onboardingContinueButton.click();
        if (this.isModelWithSecureElement()) {
            await this.authenticityStartButton.click();
            await TrezorUserEnvLink.pressYes();
            await this.authenticityContinueButton.click();
        }
        if (enableViewOnly) {
            await this.onboardingViewOnlyEnableButton.click();
        } else {
            await this.onboardingViewOnlySkipButton.click();
        }
        await this.viewOnlyTooltipGotItButton.click();
    }

    async disableFirmwareHashCheck() {
        // Desktop starts with already disabled firmware hash check. Web needs to disable it.
        await expect(this.welcomeTitle).toBeVisible({ timeout: 10000 });
        // eslint-disable-next-line @typescript-eslint/no-shadow
        await this.page.evaluate(SuiteActions => {
            window.store.dispatch({
                type: SuiteActions.DEVICE_FIRMWARE_HASH_CHECK,
                payload: { isDisabled: true },
            });
            window.store.dispatch({
                type: SuiteActions.SET_DEBUG_MODE,
                payload: { showDebugMenu: true },
            });
        }, SuiteActions);
    }
}
