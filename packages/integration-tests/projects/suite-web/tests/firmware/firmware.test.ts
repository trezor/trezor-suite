// @group:device-management
// @retry=2

describe('Firmware', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('Firmware outdated static notification should open firmware update modal', () => {
        cy.task('startEmu', { wipe: true, version: '2.3.0' });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@notification/update-firmware/button').click();

        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@modal/close-button').should('be.visible'); // modal is cancellable at this moment
        cy.getTestElement('@firmware/confirm-seed-checkbox').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();
        cy.getTestElement('@firmware/disconnect-message');
        cy.task('stopEmu');
        cy.getTestElement('@firmware/connect-in-bootloader-message', { timeout: 20000 });
        cy.log(
            'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
        );
        cy.getTestElement('@modal/close-button').click();

        
    });

    it('For latest firmware, update button in device settings should display "Up to date" but still be clickable', () => {
        // todo: do not reuse device state from previous test
        cy.task('startEmu', { wipe: false });
        cy.task('startBridge');
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
        cy.getTestElement('@settings/device/update-button')
            .should('contain.text', 'Up to date')
            .click();
        cy.getTestElement('@modal/close-button').click();
    });
});
