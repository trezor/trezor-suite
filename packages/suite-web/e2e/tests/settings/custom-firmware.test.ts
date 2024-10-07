// @group_settings

import { onNavBar } from '../../support/pageObjects/topBarObject';

// @retry=2
describe('Install custom firmware', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    /*
     * 1. Navigate to `Settings/Device`
     * 2. Click on `Install firmware`
     * 3. Select the custom firmware
     * 4. Complete the FW instalation on the device
     */
    it.skip('go to device settings and check if custom FW modal appears', () => {
        //
        // Test preparation
        //
        const testBinFile = 'trezor-2.5.1.bin';

        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/device').click();
        cy.getTestElement('@settings/device/check-seed-button').should('be.visible');

        cy.getTestElement('@settings/device/custom-firmware-modal-button')
            .should('be.enabled')
            .click({
                force: true,
            });
        //
        // Test execution
        //
        cy.getTestElement('@firmware-modal').then(fileUploadModal => {
            cy.wrap(fileUploadModal)
                .find('input[type=file]')
                .attachFile(
                    { filePath: testBinFile, encoding: 'binary' },
                    { subjectType: 'drag-n-drop' },
                );
        });
        cy.getTestElement('@firmware-modal').then(installFWbutton => {
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
        cy.getTestElement('@firmware/reconnect-device').should('be.visible');
    });
});

export {};
