// @group:suite
// @retry=2

describe('unacquired device', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true, pin_protection: false });
        cy.task('startBridge');
    });

    it('someone steals session, device status turns inactive', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.discoveryShouldFinish();

        // simulate stolen session from another window. device receives indicative button
        cy.task('stealBridgeSession');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/1/solve-issue-button').click();
        cy.getTestElement('@deviceStatus-connected');

        // when user reloads app while device is acquired, suite will not try to acquire device so that it
        // does not interferes with somebody else's session
        cy.task('stealBridgeSession');
        cy.getTestElement('@switch-device/1/solve-issue-button');
        cy.reload();
        cy.getTestElement('@device-acquire').click();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.discoveryShouldFinish();
    });

    // todo:
    // - it is broken in settings! there is not acquire button
    // - make sure it works in onboarding, I am not sure there is acquire button present
    // - also firmware update, maybe standalone backup/recovery might have custom implementation  that might be worth revisiting
    // - device state is incorrect is wrong copy!!!
});

export {};
