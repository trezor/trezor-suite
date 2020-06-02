/* eslint-disable @typescript-eslint/camelcase */

// @stable

describe('Recovery - dry run', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    it('Initialized - edge case when device disconnects during action. Recovery mode is persistent and user is allowed to reinitialize recoveryDevice call again', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.getTestElement('@settings/device/check-seed-button').click();
        cy.getTestElement('@recovery/user-understands-checkbox').click();
        cy.getTestElement('@recovery/start-button').click();
        cy.task('sendDecision');
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('stopEmu');
        cy.getTestElement('@recovery/close-button').click();
        cy.getTestElement('@modal/connect-device');
        cy.task('startEmu', { wipe: false });
        cy.reload();

        cy.getTestElement('@device-invalid-mode/recovery/rerun-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
    });
});
