/* eslint-disable @typescript-eslint/naming-convention */

// @group:suite
// @retry=2

describe('Stories of device remembering', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    // todo: this test tests nothing.
    it(`Remember standard wallet, click eject, disconnect device.`, () => {
        cy.getTestElement('@dashboard/index');
        cy.getTestElement('@dashboard/loading', { timeout: 60000 }).should('not.exist');
        cy.toggleDeviceMenu();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.task('stopEmu');
        // cy.getTestElement('@switch-device/add-wallet-button').click();
        // cy.getTestElement('@modal/connect-device');
    });
});
