describe('Backup', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.passThroughInitialRun();
    });

    it('Successful backup happy path', () => {
        // access from notification
        cy.getTestElement('@notification/no-backup/button').click();

        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();

        cy.log('Create backup on device');
        cy.getTestElement('@backup/start-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('sendDecision');
        cy.task('swipeEmu', 'up');
        cy.task('swipeEmu', 'up');
        cy.task('sendDecision');
        cy.task('inputEmu', 'all');
        cy.task('inputEmu', 'all');
        cy.task('inputEmu', 'all');
        cy.task('sendDecision');
        cy.task('sendDecision');

        cy.log('click all after checkboxes and close backup modal');
        cy.getTestElement('@backup/continue-to-pin-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();
        cy.getTestElement('@backup/continue-to-pin-button').should('not.be.disabled');
    });

    it('Backup failed', () => {
        cy.getTestElement('@notification/no-backup/button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('sendDecision');
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device', { timeout: 20000 });
        cy.task('startEmu');
        cy.getTestElement('@backup/error-message');
    });

    // todo, check that checkboxes are really disabled, but I cant now. They might be (and are) disabled by device lock from
    // finishing discovery that was triggered on dashboard.
    it.skip('Backup should reset if modal is closed', () => {});

    it.skip('When device disconnects before backup process starts, we just show reconnect your device screen and continue', () => {});
});
