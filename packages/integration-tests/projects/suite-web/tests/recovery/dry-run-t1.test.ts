/* eslint-disable @typescript-eslint/camelcase */

// @beta
// @retry=2

describe('Recovery - dry run', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    // again, timed out waiting for udp device, but why?
    it('Dry run with model One', () => {
        // todo: acquire device problem with model T1 emu, but why? stop and start bridge is sad workaround :(
        cy.task('stopBridge');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.getTestElement('@settings/device/check-seed-button').click();
        cy.getTestElement('@recovery/user-understands-checkbox').click();
        cy.getTestElement('@recovery/start-button').click();

        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/advanced').click();
        cy.task('pressYes');
        cy.getTestElement('@recovery/word-input-advanced/1');

        // todo: elaborate more
    });

});
