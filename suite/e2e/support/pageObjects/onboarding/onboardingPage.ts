import { Locator, Page, expect } from '@playwright/test';

import { setFlag } from '@suite/flags';
import { suiteSettingsActions } from '@suite/settings';
import { BackupType } from '@suite-common/suite-types';
import { Model } from '@trezor/trezor-user-env-link';

import { step } from '../../common';
import { AnalyticsSection } from '../analyticsSection';
import { DevicePrompt } from '../devicePrompt';
import { BackupSection } from './backupSection';
import { FirmwareSection } from './firmwareSection';
import { PinSection } from './pinSection';
import { TutorialSection } from './tutorialSection';
import { DeviceFixture } from '../../device';
import { SettingsPage } from '../settings/settingsPage';

export class OnboardingPage {
    readonly backup: BackupSection;
    readonly firmware: FirmwareSection;
    readonly pin: PinSection;
    readonly tutorial: TutorialSection;

    readonly welcomeBody: Locator;
    readonly completeOnboardingButton: Locator;
    readonly connectDevicePrompt: Locator;
    readonly authenticityStartButton: Locator;
    readonly authenticityContinueButton: Locator;
    readonly createBackupButton: Locator;
    readonly recoverWalletButton: Locator;
    readonly startRecoveryButton: Locator;
    readonly continueRecoveryButton: Locator;
    readonly retryRecoveryButton: Locator;
    readonly suiteLoadedIndicator: Locator;
    readonly createWalletButton: Locator;
    readonly selectSeedTypeCheckbox = (backupType: BackupType): Locator =>
        this.page.getByTestId(`@onboarding/select-seed-type-${backupType}`);
    readonly selectSeedTypeOpenButton: Locator;
    readonly selectSeedConfirmButton: Locator;
    readonly continueAtYourOwnRiskButton: Locator;
    readonly deviceCompromisedModal: Locator;
    readonly pairingInputAtIndex = (index: number) =>
        this.page.getByTestId('@modal/thp-paring').locator('input').nth(index);

    constructor(
        public page: Page,
        private readonly device: DeviceFixture,
        private readonly devicePrompt: DevicePrompt,
        private readonly analyticsSection: AnalyticsSection,
        private readonly settingsPage: SettingsPage,
    ) {
        this.backup = new BackupSection(page, device, devicePrompt);
        this.firmware = new FirmwareSection(page);
        this.tutorial = new TutorialSection(page);
        this.pin = new PinSection(page);

        this.welcomeBody = this.page.getByTestId('@welcome-layout/body');
        this.completeOnboardingButton = this.page.getByTestId('@onboarding/complete-onboarding');
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

        this.suiteLoadedIndicator = this.page.getByTestId('@suite-layout/body');

        this.createWalletButton = this.page.getByTestId('@onboarding/path-create-button');
        this.selectSeedTypeOpenButton = this.page.getByTestId(
            '@onboarding/select-seed-type-open-dialog',
        );
        this.selectSeedConfirmButton = this.page.getByTestId(
            '@onboarding/select-seed-type-confirm',
        );
        this.continueAtYourOwnRiskButton = this.page.getByTestId('@continue-to-suite');
        this.deviceCompromisedModal = this.page.getByTestId('@device-compromised');
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
        // eslint-disable-next-line playwright/no-element-handle
        this.page
            .$('[data-testid="@device-compromised/dismiss-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    @step()
    async enterTHPPairingCode() {
        const code = await this.device.getTHPPairingCode();

        for (let i = 0; i < code.length; i++) {
            await this.pairingInputAtIndex(i).fill(code[i] ?? '');
        }
    }

    @step()
    async pairTHP() {
        if (this.device.hasTHP) {
            await this.devicePrompt.allowConnectToTrezor();
            await this.enterTHPPairingCode();
            await this.enableAutoconnect();
        }
    }

    @step()
    async completeOnboarding(options?: { keepDebugModeEnabled?: boolean }) {
        await this.disableNecessaryFirmwareChecks();
        await this.disableDisconnectPrompt();
        await this.optionallyDismissFwHashCheckError();
        await this.analyticsSection.continueButton.click();

        await this.pairTHP();

        await this.completeOnboardingButton.click();
        if (this.device.hasSecureElement && this.device.model !== Model.T3W1) {
            await this.passThroughAuthenticityCheck();
        }
        // Enabled debug mode is needed for passing firmware checks but it also enables several hidden features
        // that differs from production version, so we disable it again after onboarding is done
        if (!options?.keepDebugModeEnabled) {
            await this.disableDebugMode();
        }
        await this.page.discoveryShouldFinish();
    }

    @step()
    async enableAutoconnect() {
        await this.settingsPage.navigateTo('device');
        await this.settingsPage.deviceTab.autoconnectSwitch.click();
        await this.devicePrompt.allowConnectToTrezor();
        await this.settingsPage.closeSettings();
    }

    @step()
    async completeTransactionOnboarding() {
        // NOTE: this tooltip may cover the underlying UI so it is not clickable
        const hideScamTransactionsTooltipGotItButton = this.page.getByTestId(
            '@hideScamTransactionsTooltip/gotIt',
        );
        const scamTransactionsDropdown = this.page.getByTestId(
            '@wallet/accounts/hide-scam-transactions/dropdown',
        );

        // NOTE: when this is not in the view, it is simply not visible, the test should fail if it should be visible
        if (!(await scamTransactionsDropdown.isVisible())) {
            return;
        }

        await scamTransactionsDropdown.scrollIntoViewIfNeeded();
        if (await hideScamTransactionsTooltipGotItButton.isVisible()) {
            await hideScamTransactionsTooltipGotItButton.click();
        }
    }

    @step()
    async disableFirmwareHashCheck(options?: { skipSuiteLoadedCheck?: boolean }) {
        if (!options?.skipSuiteLoadedCheck) {
            await this.verifySuiteIsLoaded();
        }

        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(
            actions => actions.forEach(window.store.dispatch),
            [
                {
                    type: suiteSettingsActions.toggleFirmwareHashCheck.type,
                    payload: false,
                },
                {
                    type: suiteSettingsActions.setDebugMode.type,
                    payload: { showDebugMenu: true },
                },
            ],
        );
    }

    @step()
    async disableDebugMode() {
        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(action => window.store.dispatch(action), {
            type: suiteSettingsActions.setDebugMode.type,
            payload: { showDebugMenu: false },
        });
    }

    @step()
    async disableFirmwareRevisionCheck() {
        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(action => window.store.dispatch(action), {
            type: suiteSettingsActions.toggleFirmwareRevisionCheck.type,
            payload: false,
        });
    }

    @step()
    async disableAuthenticityCheck() {
        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(action => window.store.dispatch(action), {
            type: suiteSettingsActions.toggleDeviceAuthenticityCheck.type,
            payload: false,
        });
    }

    @step()
    async disableDisconnectPrompt() {
        await this.page.ensureStoreOnDesktop();
        await this.page.evaluate(
            action => window.store.dispatch(action),
            setFlag({ key: 'hasSeenDisconnectTooltip', value: true }),
        );
    }

    @step()
    async disableNecessaryFirmwareChecks(options?: { skipSuiteLoadedCheck?: boolean }) {
        await this.disableFirmwareHashCheck(options);
        if (this.device.hasCanaryFirmware) {
            await this.disableFirmwareRevisionCheck();
        }

        if (this.device.model === Model.T3W1) {
            await this.disableAuthenticityCheck();
        }
    }

    @step()
    async passThroughAuthenticityCheck() {
        await this.authenticityStartButton.click();
        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        await this.authenticityContinueButton.click();
    }

    @step()
    async selectSeedType(backupType: BackupType) {
        await this.selectSeedTypeOpenButton.click();
        await this.selectSeedTypeCheckbox(backupType).click();
        await this.selectSeedConfirmButton.click();
    }
}
