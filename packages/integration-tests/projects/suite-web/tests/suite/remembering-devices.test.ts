/* eslint-disable @typescript-eslint/camelcase */
describe('Stories of device remembering', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.passThroughInitialRun();
    });

    it(`Remember standard wallet, click eject, disconnect device.`, () => {
        cy.getTestElement('@dashboard/index');
        cy.getTestElement('@dashboard/loading').should('not.be.visible');
        cy.toggleDeviceMenu();
        cy.getTestElement('@switch-device/wallet-instance/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/wallet-instance/eject-button').click();
        cy.task('stopEmu');
        cy.getTestElement('@switch-device/wallet-instance').click({ force: true });
        cy.getTestElement('@modal/connect-device');
    });
});
