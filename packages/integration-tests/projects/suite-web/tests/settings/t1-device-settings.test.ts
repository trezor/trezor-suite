// @group:bounty
// @retry=2

describe('T1 - Device settings', () => {
    it('pin mismatch', () => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT1'), wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.getTestElement('@settings/device/pin-switch').click({ force: true });
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        // todo: add support for pin to trezor-user-env. now I may safely test only wrong pin input
        // cy.getTestElement('@pin').matchImageSnapshot('first pin input');
        cy.getTestElement('@pin/input/1').click();

        cy.getTestElement('@pin/submit-button').click();
        cy.log('enter 2 digits instead of 1 in the first entry. This way pin is always wrong');
        cy.getTestElement('@pin/input/1').click();
        // cy.getTestElement('@pin').matchImageSnapshot('confirm pin input');
        cy.getTestElement('@pin/input/1').click();

        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch').matchImageSnapshot('pin-mismatch');
        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
    });

    // TODO: pin success
    // TODO: pin caching immediately after it is set
    // TODO: keyboard handling
    // TODO: set auto-lock (needs pin)
});
