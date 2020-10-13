// @group:device-management
// @retry=2

describe('Firmware', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('Firmware outdated static notification should open firmware update modal', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.task('setupEmu');
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@notification/update-firmware/button').click();

        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@firmware/confirm-seed-checkbox').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();
        cy.getTestElement('@firmware/disconnect-message');
        cy.task('stopEmu');
        cy.getTestElement('@firmware/connect-in-bootloader-message', { timeout: 10000 });
        cy.log(
            'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
        );
        // cy.getTestElement('@modal/close-button').click();
    });

    it('For latest firmware, update button in device settings should display "Up to date" but still be clickable', () => {
        cy.task('stopBridge');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
        cy.getTestElement('@settings/device/update-button')
            .should('contain.text', 'Update available')
            .click();
        cy.getTestElement('@modal/close-button').click();
    });
});
