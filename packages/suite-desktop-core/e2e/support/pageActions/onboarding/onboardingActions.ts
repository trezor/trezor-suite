import { Locator, Page, TestInfo, expect } from '@playwright/test';

import { SUITE as SuiteActions } from '@trezor/suite/src/actions/suite/constants';
import { Model } from '@trezor/trezor-user-env-link';

import { TrezorUserEnvLinkProxy, isWebProject, step } from '../../common';
import { SeedType } from '../../enums/seedType';
import { AnalyticsActions } from '../analyticsActions';
import { DevicePromptActions } from '../devicePromptActions';
import { BackupActions } from './backupActions';
import { FirmwareActions } from './firmwareActions';
import { PinActions } from './pinActions';
import { TutorialActions } from './tutorialActions';

export class OnboardingActions {
    readonly backup: BackupActions;
    readonly firmware: FirmwareActions;
    readonly pin: PinActions;
    readonly tutorial: TutorialActions;

    readonly welcomeBody: Locator;
    readonly onboardingContinueButton: Locator;
    readonly onboardingViewOnlySkipButton: Locator;
    readonly onboardingViewOnlyEnableButton: Locator;
    readonly viewOnlyTooltipGotItButton: Locator;
    readonly connectDevicePrompt: Locator;
    readonly authenticityStartButton: Locator;
    readonly authenticityContinueButton: Locator;
    readonly createBackupButton: Locator;
    readonly recoverWalletButton: Locator;
    readonly startRecoveryButton: Locator;
    readonly continueRecoveryButton: Locator;
    readonly retryRecoveryButton: Locator;
    readonly continueCoinsButton: Locator;
    readonly finalTitle: Locator;
    readonly createWalletButton: Locator;
    readonly selectSeedTypeOpenButton: Locator;
    readonly selectSeedConfirmButton: Locator;
    readonly continueAtYourOwnRiskButton: Locator;

    isModelWithSecureElement = () => ['T2B1', 'T3T1'].includes(this.model);

    constructor(
        public page: Page,
        readonly model: Model,
        private readonly testInfo: TestInfo,
        private readonly devicePrompt: DevicePromptActions,
        private readonly analyticsPage: AnalyticsActions,
    ) {
        this.backup = new BackupActions(page, devicePrompt);
        this.firmware = new FirmwareActions(page);
        this.tutorial = new TutorialActions(page);
        this.pin = new PinActions(page);

        this.welcomeBody = this.page.getByTestId('@welcome-layout/body');
        this.onboardingContinueButton = this.page.getByTestId('@onboarding/exit-app-button');
        this.onboardingViewOnlySkipButton = this.page.getByTestId('@onboarding/viewOnly/skip');
        this.onboardingViewOnlyEnableButton = this.page.getByTestId('@onboarding/viewOnly/enable');
        this.viewOnlyTooltipGotItButton = this.page.getByTestId('@viewOnlyTooltip/gotIt');
        this.connectDevicePrompt = this.page.getByTestId('@connect-device-prompt');
        this.authenticityStartButton = this.page.getByTestId('@authenticity-check/start-button');
        this.authenticityContinueButton = this.page.getByTestId(
            '@authenticity-check/continue-button',
        );
        this.createBackupButton = this.page.getByTestId('@onboarding/create-backup-button');
        this.recoverWalletButton = this.page.getByTestId('@onboarding/path-recovery-button');
        this.startRecoveryButton = this.page.getByTestId('@onboarding/recovery/start-button');
        this.continueRecoveryButton = this.page.getByTestId('@onboarding/recovery/continue-button');
        this.retryRecoveryButton = this.page.getByTestId('@onboarding/recovery/retry-button');

        this.continueCoinsButton = this.page.getByTestId('@onboarding/coins/continue-button');
        this.finalTitle = this.page.getByTestId('@onboarding/final');

        this.createWalletButton = this.page.getByTestId('@onboarding/path-create-button');
        this.selectSeedTypeOpenButton = this.page.getByTestId(
            '@onboarding/select-seed-type-open-dialog',
        );
        this.selectSeedConfirmButton = this.page.getByTestId(
            '@onboarding/select-seed-type-confirm',
        );
        this.continueAtYourOwnRiskButton = this.page.getByTestId('@continue-to-suite');
    }

    @step()
    async verifySuiteIsLoaded() {
        await expect(this.welcomeBody, 'expect Suite to load in under 30s').toBeVisible({
            timeout: 30_000,
        });
    }

    @step()
    async optionallyDismissFwHashCheckError() {
        await this.verifySuiteIsLoaded();
        // dismisses the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        this.page
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    @step()
    async completeOnboarding({ enableViewOnly = false } = {}) {
        await this.disableFirmwareHashCheck();
        await this.optionallyDismissFwHashCheckError();
        await this.analyticsPage.continueButton.click();
        await this.onboardingContinueButton.click();
        if (this.isModelWithSecureElement()) {
            await this.passThroughAuthenticityCheck();
        }
        if (enableViewOnly) {
            await this.onboardingViewOnlyEnableButton.click();
        } else {
            await this.onboardingViewOnlySkipButton.click();
        }
        await this.viewOnlyTooltipGotItButton.click();
    }

    @step()
    async disableFirmwareHashCheck(options?: { skipSuiteLoadedCheck?: boolean }) {
        // Desktop starts with already disabled firmware hash check. Web needs to disable it.
        if (!isWebProject(this.testInfo)) {
            return;
        }

        if (!options?.skipSuiteLoadedCheck) {
            await this.verifySuiteIsLoaded();
        }
        // eslint-disable-next-line @typescript-eslint/no-shadow
        await this.page.evaluate(SuiteActions => {
            // WARNING: If this dispatch is changed as part of refactoring. You need to change also:
            // packages/suite-desktop-core/e2e/support/electron.ts variable disableHashCheckArgument
            window.store.dispatch({
                type: SuiteActions.TOGGLE_FIRMWARE_HASH_CHECK,
                payload: false,
            });
            window.store.dispatch({
                type: SuiteActions.SET_DEBUG_MODE,
                payload: { showDebugMenu: true },
            });
        }, SuiteActions);
    }

    @step()
    async passThroughAuthenticityCheck() {
        await this.authenticityStartButton.click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
        await this.authenticityContinueButton.click();
    }

    @step()
    async selectSeedType(seedType: SeedType) {
        await this.selectSeedTypeOpenButton.click();
        await this.page.getByTestId(`@onboarding/select-seed-type-${seedType}`).click();
        await this.selectSeedConfirmButton.click();
    }
}
