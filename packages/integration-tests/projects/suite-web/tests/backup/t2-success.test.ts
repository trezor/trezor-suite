// @group:device-management
// @retry=2

describe('Backup', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Successful backup happy path', () => {
        // access from notification
        cy.getTestElement('@notification/no-backup/button').click();

        cy.getTestElement('@backup').matchImageSnapshot('backup')
        
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();

        cy.log('Create backup on device');
        cy.getTestElement('@backup/start-button').click();
        cy.getConfirmActionOnDeviceModal();
        
        cy.task('pressYes');
        cy.task('swipeEmu', 'up');
        cy.task('swipeEmu', 'up');
        cy.task('pressYes');
        cy.task('inputEmu', 'all');
        cy.task('inputEmu', 'all');
        cy.task('inputEmu', 'all');
        cy.task('pressYes');
        cy.task('pressYes');

        cy.log('click all after checkboxes and close backup modal');
        cy.getTestElement('@backup/continue-to-pin-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();
        cy.getTestElement('@backup/continue-to-pin-button').should('not.be.disabled');
    });
});
