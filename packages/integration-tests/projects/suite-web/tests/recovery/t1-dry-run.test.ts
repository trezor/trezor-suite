/* eslint-disable @typescript-eslint/naming-convention */

// @group:device-management

describe.skip('Recovery - dry run', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.wait(2000);
        cy.task('setupEmu', { needs_backup: false });
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    it('Dry run with model One', () => {
        cy.getTestElement('@settings/device/check-seed-button').click();
        cy.getTestElement('@recovery/user-understands-checkbox').click();
        cy.getTestElement('@recovery/start-button').click();

        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/advanced').click();
        cy.task('pressYes');
        cy.getTestElement('@recovery/word-input-advanced/1');

        // todo: elaborate more, seems like finally t1 tests are stable so it would make finally sense to finish this
    });
});
