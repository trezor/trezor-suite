// @group:device-management
// @retry=2

describe('Backup', () => {
    beforeEach(() => {
        cy.task('stopBridge');
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Backup should reset if modal is closed', () => {
        cy.getTestElement('@notification/no-backup/button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/close-button').click();
        cy.getTestElement('@notification/no-backup/button').click();
        cy.log('at this moment, after modal was closed and opened again, no checkbox should be checked');
        cy.getTestElement('@backup/check-item/understands-what-seed-is').should('not.be.checked');
    });

    it('User is doing backup with device A -> disconnects device A -> connects device B with backup already finished', () => {
        cy.getTestElement('@notification/no-backup/button').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device', { timeout: 20000 });
        cy.task('stopBridge');
        // latest (2.3.1 at the time of writing this) has default behavior needs_backup false
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        // noticed that it failed here times: 1
        cy.getTestElement('@backup/already-finished-message');
    });

    // https://github.com/trezor/trezor-suite/issues/1116#issuecomment-634299789
    it('User disconnected device that is remembered. Should not be allowed to initiate backup', () => {
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('be.visible');
        cy.toggleDeviceMenu();
        cy.getTestElement('@switch-device/wallet-instance/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/wallet-instance').click();
        cy.getTestElement('@notification/no-backup/button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device');
    })
});
