// @group:device-management
// @retry=2

describe('Firmware', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('Firmware outdated notification banner should open firmware update modal', () => {
        cy.task('startEmu', { wipe: true, version: '2.3.0' });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.matchImageSnapshot('outdated notification banner');
        cy.getTestElement('@notification/update-firmware/button').click();

        // initial screen
        cy.getTestElement('@firmware').matchImageSnapshot('initial');
        cy.getTestElement('@firmware/continue-button').click();

        // check seed screen
        cy.getTestElement('@modal/close-button').should('be.visible'); // modal is cancellable at this moment
        cy.getTestElement('@firmware').matchImageSnapshot('check-seed');
        cy.getTestElement('@firmware/confirm-seed-checkbox').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();

        // reconnect in bootloader screen (disconnect)
        cy.getTestElement('@firmware/disconnect-message');
        cy.getTestElement('@firmware').matchImageSnapshot('disconnect');
        cy.task('stopEmu');

        // reconnect in bootloader screen (connect in bootloader)
        cy.getTestElement('@firmware/connect-in-bootloader-message', { timeout: 20000 });
        cy.getTestElement('@firmware').matchImageSnapshot('reconnect in bootloader');
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
