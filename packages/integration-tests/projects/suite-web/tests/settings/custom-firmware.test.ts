// @group:settings
// @retry=2
describe('Install custom firmware', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });
    /*
    *1. Navigate to `Settings/Device`
    *2. Click on `Install firmware`
    *3. Select the custom firmware
        a)Observe the initialization on the device
    *4. Complete the FW instalation on the device
    */

    it('go to device settings and check if custom FW modal appears', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/device/custom-firmware-modal-button').click({
            force: true,
        });
        //
        // Test execution
        //
        cy.getTestElement('@firmware-custom').then(fileUploadModal => {
            cy.wrap(fileUploadModal)
                .find('input[type=file]')
                .attachFile('testFirmware.bin', { subjectType: 'drag-n-drop' });
        });
        cy.getTestElement('@firmware-custom').then(installFWbutton => {
            cy.wrap(installFWbutton)
                .find('[class*="Button"]')
                .should('not.be.disabled')
                .contains('Install firmware')
                .click();
        });
        cy.getTestElement('@firmware/confirm-seed-checkbox').click();
        cy.getTestElement('@firmware/confirm-seed-button').click();
        //
        // Assert
        //
        cy.getTestElement('@firmware/reconnect-device/bootloader').should('be.visible');
    });
});
