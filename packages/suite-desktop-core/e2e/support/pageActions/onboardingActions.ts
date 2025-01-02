import { Locator, Page, TestInfo, expect } from '@playwright/test';

import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { SUITE as SuiteActions } from '@trezor/suite/src/actions/suite/constants';

import { AnalyticsActions } from './analyticsActions';
import { isWebProject, step } from '../common';
import { DevicePromptActions } from './devicePromptActions';
import { SeedType } from '../enums/seedType';

export class OnboardingActions {
    readonly welcomeTitle: Locator;
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
    readonly firmwareContinueButton: Locator;
    readonly skipFirmwareButton: Locator;
    readonly skipConfirmButton: Locator;
    readonly skipPinButton: Locator;
    readonly skipTutorialButton: Locator;
    readonly continueCoinsButton: Locator;
    readonly tutorialContinueButton: Locator;
    readonly continuePinButton: Locator;
    readonly setPinButton: Locator;
    readonly finalTitle: Locator;
    readonly startBackupButton: Locator;
    readonly closeBackupButton: Locator;
    readonly wroteSeedProperlyCheckbox: Locator;
    readonly madeNoDigitalCopyCheckbox: Locator;
    readonly willHideSeedCheckbox: Locator;
    readonly createWalletButton: Locator;
    readonly selectSeedTypeOpenButton: Locator;
    readonly selectSeedConfirmButton: Locator;

    isModelWithSecureElement = () => ['T2B1', 'T3T1'].includes(this.model);

    constructor(
        public page: Page,
        private analyticsPage: AnalyticsActions,
        private readonly devicePrompt: DevicePromptActions,
        private readonly model: Model,
        private readonly testInfo: TestInfo,
    ) {
        this.welcomeTitle = this.page.getByTestId('@welcome/title');
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
        this.firmwareContinueButton = this.page.getByTestId('@firmware/continue-button');
        this.skipFirmwareButton = this.page.getByTestId('@firmware/skip-button');
        this.skipPinButton = this.page.getByTestId('@onboarding/skip-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
        this.skipTutorialButton = this.page.getByTestId('@tutorial/skip-button');
        this.continueCoinsButton = this.page.getByTestId('@onboarding/coins/continue-button');
        this.tutorialContinueButton = this.page.getByTestId('@tutorial/continue-button');
        this.continuePinButton = this.page.getByTestId('@onboarding/pin/continue-button');
        this.setPinButton = this.page.getByTestId('@onboarding/set-pin-button');
        this.finalTitle = this.page.getByTestId('@onboarding/final');
        this.startBackupButton = this.page.getByTestId('@backup/start-button');
        this.closeBackupButton = this.page.getByTestId('@backup/close-button');
        this.wroteSeedProperlyCheckbox = this.page.getByTestId('@backup/check-item/wrote-seed-properly');
        this.madeNoDigitalCopyCheckbox = this.page.getByTestId('@backup/check-item/made-no-digital-copy');
        this.willHideSeedCheckbox = this.page.getByTestId('@backup/check-item/will-hide-seed');
        this.createWalletButton = this.page.getByTestId('@onboarding/path-create-button');
        this.selectSeedTypeOpenButton = this.page.getByTestId('@onboarding/select-seed-type-open-dialog');
        this.selectSeedConfirmButton = this.page.getByTestId('@onboarding/select-seed-type-confirm');
    }

    @step()
    async optionallyDismissFwHashCheckError() {
        await expect(this.welcomeTitle).toBeVisible({ timeout: 10000 });
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

    @step()
    async disableFirmwareHashCheck() {
        // Desktop starts with already disabled firmware hash check. Web needs to disable it.
        if (!isWebProject(this.testInfo)) {
            return;
        }

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

    @step()
    async passThroughAuthenticityCheck() {
        // enable debug mode to allow debug keys for authenticity check
        // eslint-disable-next-line @typescript-eslint/no-shadow
        await this.page.evaluate(SuiteActions => {
            window.store.dispatch({
                type: SuiteActions.SET_DEBUG_MODE,
                payload: { showDebugMenu: true },
            });
        }, SuiteActions);
    
        await this.page.getByTestId('@authenticity-check/start-button').click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();
        await this.page.getByTestId('@authenticity-check/continue-button').click();
    };

    @step()
    async skipFirmware() {
        await this.skipFirmwareButton.click();
        await this.skipConfirmButton.click();
    }

    @step()
    async skipPin() {
        await this.skipPinButton.click();
        await this.skipConfirmButton.click();
    }

    @step()
    async skipTutorial() {
        await this.skipTutorialButton.click();
        await this.tutorialContinueButton.click();
    }

    @step()
    async selectSeedType(seedType: SeedType) {
        await this.createWalletButton.click();
        await this.selectSeedTypeOpenButton.click();
        await this.page.getByTestId(`@onboarding/select-seed-type-${seedType}`).click();
        await this.selectSeedConfirmButton.click();
    }

    @step()
    async passThroughBackupShamir(shares: number, threshold: number) {
        await expect(this.startBackupButton).toBeDisabled();

        await this.wroteSeedProperlyCheckbox.click();
        await this.madeNoDigitalCopyCheckbox.click();
        await this.willHideSeedCheckbox.click();

        await this.startBackupButton.click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        
        await TrezorUserEnvLink.readAndConfirmShamirMnemonicEmu({ shares, threshold });

        await this.closeBackupButton.click();
    }
}
