describe('Firmware', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('firmware outdated static notification should open firmware update modal', () => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@notification/update-firmware/button').click();
        cy.getTestElement('@firmware/start-button').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();
        cy.getTestElement('@firmware/disconnect-message');
        cy.task('stopEmu');
        // disconnecting might take a little longer in CI
        cy.getTestElement('@firmware/disconnect-message', { timeout: 20000 }).should('not.exist');
        cy.getTestElement('@firmware/connect-message');
        cy.log(
            'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
        );
        cy.getTestElement('@firmware/close-button').click();
    });

    // todo finish this in next PR. I need to figure out how to setupEmu through debug link.
    // otherwise it goes through bridge and steals session
    it.skip('For latest firmware, update button in device settings should display Up to date but still be clickable', () => {
        cy.task('stopBridge');
        cy.task('startEmu', '2.2.0');
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.visit('/settings/device');
        cy.passThroughInitialRun();
        cy.getTestElement('@settings/device/update-button').should('contain.text', 'Up to date');
    });
});
