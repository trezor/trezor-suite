// @group:settings
// @retry=2

describe('T2T1 - Device settings', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startBridge');
    });
    // TODO: cypress open: seems like entering urls (/settings/device) directly does not work anymore?
    /*
     * Test case:
     * 1. Navigate to settings/device screen and wait for it to load
     * 2. open the firmware update modal
     * 3. verify it by clicking on the close btn
     * 4. change the trezor's name via its input
     * 5. verify the name from top left wallet overview btn
     * 6. enable the passphrase protection
     * 7. verify that the passphrase input is now enabled
     * 8. change the device's rotation
     */
    it('change all possible device settings', () => {
        //
        // Test preparation & constants
        //
        const newDeviceName = 'TREVOR!';
        const editNameBtn = '@settings/device/label-submit';

        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        // navigate to device settings page
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        //
        // Test execution
        //

        // verify firmware modal
        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button')
            .should('be.visible')
            .click({ scrollBehavior: false });
        cy.getTestElement('@modal/close-button').click();

        // change device's name
        cy.log(`-> Filling in ${newDeviceName} as new trezor's name.`);
        cy.getTestElement('@settings/device/label-input').clear().type(newDeviceName);
        cy.getTestElement(editNameBtn).should('be.enabled');
        cy.getTestElement(editNameBtn).click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');
        cy.log('-> Done.');

        // verify the name change
        cy.getTestElement('@menu/switch-device').contains(newDeviceName);

        // enable passphrase protection
        cy.log('turn on passphrase protection');
        cy.getTestElement('@settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // verify enabling
        cy.getTestElement('@settings/device/passphrase-switch').find('input').should('be.checked');

        // change display rotation
        cy.log('change display rotation');
        cy.getTestElement('@settings/device/rotation-button/90')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');
    });

    it('unable to change homescreen in firmware < 2.5.4', () => {
        cy.task('startEmu', { wipe: true, version: '2.5.3' });
        cy.task('setupEmu');

        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.log('Try to change device homescreen');
        cy.getTestElement('@settings/device/homescreen').scrollIntoView();

        cy.getTestElement('@settings/device/homescreen-gallery').should('be.disabled');
        cy.getTestElement('@settings/device/homescreen-upload').should('be.disabled');
    });

    it('able to change homescreen in firmware >= 2.5.4', () => {
        cy.task('startEmu', { wipe: true, version: '2-main' });
        cy.task('setupEmu');

        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.log('Try to change device homescreen');
        cy.getTestElement('@settings/device/homescreen').scrollIntoView();

        cy.getTestElement('@settings/device/homescreen-gallery').click();
        cy.get('#original_t2t1').should('exist');
    });

    it('backup in settings', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });

        // navigate to device settings page
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click({ scrollBehavior: false });
        cy.getTestElement('@backup');
    });

    it('wipe device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        // navigate to device settings page
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.getTestElement('@settings/device/open-wipe-modal-button').click();
        cy.getTestElement('@wipe/checkbox-1').click();
        cy.getTestElement('@wipe/checkbox-2').click();
        cy.getTestElement('@wipe/wipe-button').click();
        cy.task('pressYes');
    });

    // TODO: upload custom image
    // TODO: set auto-lock (needs pin)
});

export {};
