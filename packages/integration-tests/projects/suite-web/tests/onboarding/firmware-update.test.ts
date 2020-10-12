// @stable/device-management
// @retry=2

describe('Onboarding - firmware update', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
    });

    it('firmware update error', () => {
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/get-ready-button').click();
        cy.task('stopEmu');
        cy.getTestElement('@firmware/connect-in-bootloader-message');

        cy.connectBootloaderDevice('1');
        cy.getTestElement('@firmware/install-button').click();
        // error from connect
        cy.getTestElement('@firmware/error-message').should('contain', 'Device not found');

        // this simulates that device lost its firmware
        cy.changeDevice(
            '1',
            {
                firmware: 'none',
                mode: 'bootloader',
            },
            { bootloader_mode: true },
        );

        // now there is retry button which should retry firmware update right away

        // and back button which reset state of firmware update and brings user back to initial screen
        cy.getTestElement('@onboarding/back-button').click();
        cy.getTestElement('@firmware/install-button');
    });
});
