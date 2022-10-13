// @group:bounty
// @retry=2

describe('T1 - Device settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
    });
    afterEach(() => {
        cy.task('stopEmu');
    });

    it('pin mismatch', () => {
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
    /*
     * 1. navigate to settings/device screen and wait for it to load
     * 2. Select & click Choose from gallery in Customization section
     * 3. Select Doge homescreen
     * 4. Confirm on device
     * 5. Wait for success notification Settings applied
     */
    it('change homescreen', () => {
        //
        // Test preparation
        //

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        //
        // Test execution
        //

        cy.getTestElement('@settings/device/select-from-gallery').click();
        cy.get('#doge').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.wait(2000);
        cy.task('pressYes');
        cy.wait(2000);

        //
        // Assert
        //
        cy.getTestElement('@toast/settings-applied').should('be.visible');
    });
    // TODO: pin success
    // TODO: pin caching immediately after it is set
    // TODO: keyboard handling
    // TODO: set auto-lock (needs pin)
});
