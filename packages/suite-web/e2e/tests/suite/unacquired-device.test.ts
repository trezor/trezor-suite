// @group:suite
// @retry=2

describe('unacquried device', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('how acquiring device works', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        // simulate stolen session from another window. device receives indicative button
        cy.task('stealBridgeSession');
        cy.getTestElement('@menu/switch-device/refresh-button').click();
        cy.getTestElement('@deviceStatus-connected');

        // reload app while session is stolen, suite will not try to acquire device so that it
        // does not interfers with somebody else's session
        cy.task('stealBridgeSession');
        cy.getTestElement('@menu/switch-device/refresh-button');
        cy.reload();
        cy.getTestElement('@device-acquire').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@deviceStatus-connected');

        // todo:
        // - it is broken in settings! there is not acquire button
        // - make sure it works in onboarding, I am not sure there is acquire button present
        // - also firmware update, maybe standalone backup/recovery might have custom implementation  that might be worth revisiting
    });
});

export {};
