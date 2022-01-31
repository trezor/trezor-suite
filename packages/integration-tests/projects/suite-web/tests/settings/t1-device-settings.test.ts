// @group:bounty
// @retry=2

describe('T1 - Device settings', () => {
    it('pin mismatch', () => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT1'), wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

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
        cy.getTestElement('@pin-mismatch').matchImageSnapshot();
        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
    });

    it('does not show auto-lock select because it is not supported on fw <1.9.4', () => {
        cy.task('startEmu', { version: '1.9.3', wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        // TODO - add pin to verify it properly
        cy.getTestElement('@settings/auto-lock-select/input').should('not.exist');
    });

    // TODO: pin success
    // TODO: pin caching immediately after it is set
    // TODO: keyboard handling
    // TODO: set auto-lock (needs pin)
});
