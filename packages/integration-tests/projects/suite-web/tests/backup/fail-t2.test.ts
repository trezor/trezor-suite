// @beta

describe('Backup', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Backup failed - device disconnected during action', () => {
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

        cy.log('Now go to dashboard and see if security card and notification reflects backup failed state correctly');
        cy.getTestElement('@backup/close-button').click();
        cy.getTestElement('@notification/failed-backup/learn-more-link').should('be.visible');

        cy.getTestElement('@dashboard/security-card/backup/button', { timeout: 20000 }).click();
        cy.getTestElement('@backup/already-failed-message');
    });
});
