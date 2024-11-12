// @group_device-management
// @retry=2

import { onAnalyticsPage } from '../../../support/pageObjects/analyticsObject';
import { onConnectDevicePrompt } from '../../../support/pageObjects/connectDeviceObject';
import { onOnboardingPage } from '../../../support/pageObjects/onboardingObject';
import { onNavBar } from '../../../support/pageObjects/topBarObject';

describe('Onboarding - recover wallet T2T1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        // note: this is an example of test that can not be parametrized to be both integration (isolated) test and e2e test.
        // the problem is that it always needs to run the newest possible emulator. If this was pinned to use emulator which is currently
        // in production, and we locally bumped emulator version, we would get into a screen saying "update your firmware" and the test would fail.
        cy.task('startEmu', { wipe: true, model: 'T2T1', version: '2-main' });

        // Disable revision check. On emulator '2-main' it wont pass as it is unreleased version
        cy.getTestElement('@device-compromised').should('be.visible');
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/device').click();
        cy.getTestElement('@settings/device/open-firmware-revision-check-modal-button').click();
        cy.getTestElement('@device-firmware-revision/checkbox').click();
        cy.getTestElement('@device-firmware-revision/opt-out-button').click();
        cy.getTestElement('@settings/menu/close').click();

        cy.step('Go through analytics', () => {
            onAnalyticsPage.continue();
            onAnalyticsPage.continue();
        });
    });

    it('Device disconnected during recovery offers retry', () => {
        cy.step('Start wallet recovery process and confirm on device', () => {
            onOnboardingPage.continueFirmware();
            onOnboardingPage.recoverWallet();
            onOnboardingPage.startRecovery();

            onOnboardingPage.waitForConfirmationOnDevice();
        });

        cy.step('Disconnect device', () => {
            cy.wait(1000);
            cy.task('stopEmu');
            cy.wait(500);
            onConnectDevicePrompt.waitForConnectDevicePrompt();
            cy.task('startEmu', { model: 'T2T1', version: '2-main', wipe: false });
        });

        cy.step('Check that you can retry', () => {
            onOnboardingPage.retryRecovery();
            onOnboardingPage.waitForConfirmationOnDevice();
        });
    });
});
