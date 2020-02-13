describe('Firmware', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.passThroughInitialRun();
    });

    it('firmware outdated static notification should open firmware update modal', () => {
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
});
