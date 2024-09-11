// @group_device-management
// @retry=2

import { onNavBar } from '../../support/pageObjects/topBarObject';
import { onSettingsMenu } from '../../support/pageObjects/settingsMenuObject';
import { onSettingsDevicePage } from '../../support/pageObjects/settingsDeviceObject';
import { onMultiShareBackupModal } from '../../support/pageObjects/multiShareBackupObject';

const mnemonic =
    'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember';
describe('Backup success', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, model: 'T3T1', version: '2.8.1' });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic,
        });
        cy.task('startBridge');

        cy.viewport('macbook-15').resetDb();
        cy.prefixedVisit('/');
    });

    it('Successful backup happy path', () => {
        // Arrange
        cy.getTestElement('@analytics/continue-button', { timeout: 40000 })
            .click()
            .getTestElement('@onboarding/exit-app-button')
            .click();
        cy.passThroughAuthenticityCheck();
        cy.getTestElement('@onboarding/viewOnly/enable').click();
        cy.getTestElement('@viewOnlyTooltip/gotIt', { timeout: 15000 })
            .should('be.visible')
            .click();

        // Act
        // navigate to device settings page
        onNavBar.openSettings();
        onSettingsMenu.openDeviceSettings();
        onSettingsDevicePage.openCreateMultiShareBackup();
        onMultiShareBackupModal.createMultiShareBackup();

        // [device screen] check your backup?
        cy.task('swipeEmu', 'up');

        // [device screen] select the number of words in your backup
        cy.task('inputEmu', '20');

        // [device screen] backup instructions
        cy.task('swipeEmu', 'up');
        for (const word of mnemonic.split(' ')) {
            // [device screen] enter next word
            cy.task('inputEmu', word);
        }

        // [device screen] create additional backup?
        cy.wait(1000); // without this timeout, backup on device simply disappears, it stinks
        cy.task('swipeEmu', 'up');

        cy.task('readAndConfirmShamirMnemonicEmu', { shares: 3, threshold: 2 });

        // Assert
        onMultiShareBackupModal.finalizeMultiShareBackup();
    });
});

export {};
