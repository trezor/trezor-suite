/* eslint-disable @typescript-eslint/camelcase */

// @beta

describe('Recovery - dry run', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    it('Model T, initialized - edge case when device disconnects during action. Recovery mode is persistent and user is allowed to reinitialize recoveryDevice call again', () => {
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

    // again, timed out waiting for udp device, but why?
    it.skip('Dry run with model One', () => {
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
        cy.task('sendDecision');
        cy.getTestElement('@recovery/word-input-advanced/1');

        // todo: elaborate more
    });

});
