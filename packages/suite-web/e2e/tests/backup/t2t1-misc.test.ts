// @group:device-management
// @retry=2

describe('Backup misc', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Backup should reset if modal is closed', () => {
        cy.getTestElement('@notification/no-backup/button').click({ force: true });
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/close-button').click();
        cy.getTestElement('@notification/no-backup/button').click({ force: true });
        cy.log(
            'at this moment, after modal was closed and opened again, no checkbox should be checked',
        );
        cy.getTestElement('@backup/check-item/understands-what-seed-is').should('not.be.checked');
    });

    // todo:
    // testing edge case like this got broken when we switched to using bridge proxy on 21326. The problem is, that the
    // proxy itself does not reply with the same response like bridge in some edge cases, for example when bridge is down,
    // post request to / should not get response like this
    // Error response
    // Error code: 404
    // Message: Error trying to proxy: / Error: HTTPConnectionPool(host='0.0.0.0', port=21325): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7fe16a30a460>: Failed to establish a new connection: [Errno 111] Connection refused')).
    // Error code explanation: 404 - Nothing matches the given URI.
    // issue here: https://github.com/trezor/trezor-user-env/issues/43
    it.skip('User is doing backup with device A -> disconnects device A -> connects device B with backup already finished', () => {
        cy.getTestElement('@notification/no-backup/button').click({ force: true });
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
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch', {
            // todo: is that timeout needed?
            timeout: 30000,
        }).click({
            force: true,
        });
        cy.getTestElement('@switch-device/wallet-on-index/0').click();
        cy.getTestElement('@notification/no-backup/button').click({ force: true });
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.task('stopEmu');
        cy.getTestElement('@backup/no-device');
    });
});

export {};
