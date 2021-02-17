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
        // to make screenshots stable, make changelog fixed height
        cy.getTestElement('@firmware/initial/changelog').invoke('css', 'height', '300px')
        cy.getTestElement('@firmware')
            .matchImageSnapshot('initial', {
                // to make screenshot test stable we need to blackout all parts that change expectedly
                blackout: [
                    '[data-test="@firmware/initial/changelog"]',
                    '[data-test="@firmware/initial/heading/version"]',
                    '[data-test="@firmware/initial/subheading/version"]',
                ]
            });
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
            .should('contain.text', 'Up to date') // TODO: don't depend on actual text on the button, instead each button should have different data-test attr
            .click();
        cy.getTestElement('@modal/close-button').click();
    });
});
