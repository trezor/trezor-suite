// @group_suite
// @retry=2

import { onNavBar } from '../../support/pageObjects/topBarObject';
import { onSettingsMenu } from '../../support/pageObjects/settings/settingsMenuObject';
import { onSettingsDevicePage } from '../../support/pageObjects/settings/settingsDeviceObject';

describe('Check notification toast', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case
     * 1. Pass onboarding.
     * 2. Navigate to Settings/device.
     * 3. Change passphrase settings.
     * 4. Confirm on device.
     * 5. Check that toast notification is rendered.
     */
    it('Check notification toast', () => {
        cy.log('turn on passphrase protection');
        onNavBar.openSettings();
        onSettingsMenu.openDeviceSettings();
        cy.getTestElement('@settings/device/safety-checks-button').should('be.enabled');
        onSettingsDevicePage.togglePassphraseSwitch();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');
        //
        // Assert
        //
        cy.getTestElement('@toast/settings-applied').should('be.visible');
    });
});
