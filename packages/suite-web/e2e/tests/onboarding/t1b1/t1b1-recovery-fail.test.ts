// @group_device-management
// @retry=2

import { onOnboardingPage } from '../../../support/pageObjects/onboardingObject';
import { onAnalyticsPage } from '../../../support/pageObjects/analyticsObject';
import { onRecoverPage } from '../../../support/pageObjects/recoverObject';
import { onConnectDevicePrompt } from '../../../support/pageObjects/connectDeviceObject';

describe('Onboarding - recover wallet T1B1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { model: 'T1B1', version: '1-latest', wipe: true });
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.disableFirmwareHashCheck();

        cy.step('Go through analytics', () => {
            onAnalyticsPage.continue();
            onAnalyticsPage.continue();
        });
    });

    it('Device disconnected during recovery offers retry', () => {
        cy.step('Start wallet recovery process and confirm on device', () => {
            onOnboardingPage.continueFirmware();
            onOnboardingPage.recoverWallet();
            onRecoverPage.selectWordCount(24);
            onRecoverPage.selectBasicRecovery();
            onOnboardingPage.waitForConfirmationOnDevice();
            cy.wait(1000);
            cy.task('pressYes');
            cy.wait(1000);
        });

        cy.step('Disconnect device', () => {
            cy.task('stopEmu');
            cy.wait(500);
            onConnectDevicePrompt.waitForConnectDevicePrompt();
            cy.task('startEmu', { model: 'T1B1', version: '1-latest', wipe: false });
        });

        cy.step('Check that you can retry', () => {
            onOnboardingPage.retryRecovery();
            onRecoverPage.selectWordCount(24);
            onRecoverPage.selectBasicRecovery();
            onOnboardingPage.waitForConfirmationOnDevice();
        });
    });
});
