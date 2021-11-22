// @group:settings
// @retry=2

describe('General settings', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('startEmu', { version: Cypress.env('emuVersionT1'), wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    /**
     * Test case:
     * 1. Wait for page to load by checking the default currency and value (USD)
     * 2. Navigate to settings/device screen and wait for it to load
     * 3. Fill in new trezor's name
     * 4. Approve it in device's emulation
     * 5. Wait for confirmation modal to disappear
     * 6. Verify that the name indeed changed
     */
    it('Change my trezors name in "device settings" page', () => {
        //
        // Test data & constants
        //
        const newDeviceName = 'Done!';
        const editNameBtn = '@settings/device/label-submit';
        const confirmPopup = 'img[class*="DeviceConfirm"]';
        //
        // Test execution
        //
        cy.task('log', '-> Going to the device settings page.');
        cy.getTestElement('@dashboard/index').should('contain', '$0.00');
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-device').click();
        cy.contains('h1', 'Settings').should('be.visible');

        cy.task('log', `-> Filling in ${newDeviceName} as new trezor's name.`);
        cy.getTestElement('@settings/device/label-input').clear().type(newDeviceName);
        cy.getTestElement(editNameBtn).should('be.enabled');
        cy.getTestElement(editNameBtn).click();
        cy.get(confirmPopup).should('be.visible');
        cy.task('pressYes');
        cy.get(confirmPopup).should('not.exist');
        cy.task('log', '-> Done.');

        //
        // Assert
        //
        cy.get('[class*="DeviceLabel"]')
            .invoke('text')
            .then(deviceName => {
                expect(deviceName).to.be.equal(newDeviceName);
            });
    });
});
