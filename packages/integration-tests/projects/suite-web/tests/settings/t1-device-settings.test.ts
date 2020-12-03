// @group:settings
// @retry=2

describe('Device settings', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    it('t1 - pin mismatch', () => {
        cy.getTestElement('@settings/device/pin-switch').click({ force: true });
        cy.task('pressYes');
        // todo: add support for pin to trezor-user-env. now I may safely test only wrong pin input
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.log('enter 2 digits instead of 1 in the first entry. This way pin is always wrong');
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/input/1').click();

        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch');
        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
    });

    // TODO: t1 - pin success
    // TODO: t1 - pin caching immediately after it is set
    // TODO: t1 - keyboard handling
});
