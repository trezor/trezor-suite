describe('Firmware', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('Firmware outdated static notification should open firmware update modal', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.task('setupEmu');
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@notification/update-firmware/button').click();

        cy.log('check if bitcoin only toggle works');
        cy.getTestElement('@firmware/toggle-bitcoin-only/btc').click();
        cy.getTestElement('@firmware/new/btc-only-badge');
        cy.getTestElement('@firmware/toggle-bitcoin-only/full').click();

        cy.getTestElement('@firmware/start-button').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();
        cy.getTestElement('@firmware/disconnect-message');
        cy.task('stopEmu');
        cy.getTestElement('@firmware/connect-message');
        cy.log(
            'And this is the end my friends. Emulator does not support bootloader, so we can not proceed with actual fw install',
        );
        cy.getTestElement('@firmware/close-button').click();
    });

    it('For latest firmware, update button in device settings should display "Up to date" but still be clickable', () => {
        cy.task('stopBridge');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.visit('/settings/device');
        cy.passThroughInitialRun();
        cy.getTestElement('@settings/device/update-button').should('contain.text', 'Up to date').click();
        cy.getTestElement('@firmware/close-button').click();
    });

});
