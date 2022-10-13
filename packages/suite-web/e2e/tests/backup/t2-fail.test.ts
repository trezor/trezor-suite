/* eslint-disable @typescript-eslint/prefer-ts-expect-error */

// @group:device-management
// @retry=2

// @ts-ignore
describe('Backup fail', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
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
        cy.task('pressYes');
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device', { timeout: 30000 });
        cy.task('startEmu');
        cy.getTestElement('@backup/error-message', { timeout: 30000 });

        cy.log(
            'Now go to dashboard and see if security card and notification reflects backup failed state correctly',
        );
        cy.getTestElement('@backup/close-button').click();

        cy.getTestElement('@notification/failed-backup/cta').should('be.visible');

        cy.getTestElement('@dashboard/security-card/backup/button', { timeout: 30000 }).should(
            'be.disabled',
        );
    });
});
