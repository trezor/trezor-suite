// @group:settings
// @retry=2

describe('T2 - Device settings', () => {
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
     * 8. change the device's background
     * 9. hange the device's rotation
     */
    it('change all possible device settings', () => {
        //
        // Test preparation & constants
        //
        const newDeviceName = 'TREVOR!';
        const editNameBtn = '@settings/device/label-submit';
        const confirmPopup = 'img[class*="DeviceConfirm"]';

        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        // navigate to device settings page
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();
        cy.contains('h1', 'Settings').should('be.visible');

        //
        // Test execution
        //

        // verify firmware modal
        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button').click({ scrollBehavior: false });
        cy.getTestElement('@modal/close-button').click();

        // change device's name
        cy.log(`-> Filling in ${newDeviceName} as new trezor's name.`);
        cy.getTestElement('@settings/device/label-input').clear().type(newDeviceName);
        cy.getTestElement(editNameBtn).should('be.enabled');
        cy.getTestElement(editNameBtn).click();
        cy.get(confirmPopup).should('be.visible');
        cy.task('pressYes');
        cy.get(confirmPopup).should('not.exist');
        cy.log('-> Done.');

        // verify the name change
        cy.getTestElement('@menu/switch-device')
            .find('[class*="DeviceLabel"] > span')
            .invoke('text')
            .then(deviceName => {
                expect(deviceName).to.be.equal(newDeviceName);
            });

        // enable passphrase protection
        cy.log('turn on passphrase protection');
        cy.getTestElement('@settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // verify enabling
        cy.getTestElement('@settings/device/passphrase-switch').find('input').should('be.checked');

        // change background
        cy.log('change background');
        cy.getTestElement('@settings/device/select-from-gallery')
            .click()
            .getTestElement(`@modal/gallery/t2/xmr`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // change display rotation
        cy.log('change display rotation');
        cy.getTestElement('@settings/device/rotation-button/90')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');
    });

    it('backup in settings', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: true });

        // navigate to device settings page
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click({ scrollBehavior: false });
        cy.getTestElement('@backup');
    });

    it('does not show auto-lock select because it is not supported on fw <2.3.5 ', () => {
        cy.task('startEmu', { wipe: true, version: '2.3.4' });
        cy.task('setupEmu');

        // navigate to device settings page
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        // TODO - add pin to verify it properly

        cy.getTestElement('@settings/auto-lock-select/input').should('not.exist');
    });

    it('wipe device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        // navigate to device settings page
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        cy.getTestElement('@settings/device/open-wipe-modal-button').click();
        cy.getTestElement('@wipe/checkbox-1').click();
        cy.getTestElement('@wipe/checkbox-2').click();
        cy.getTestElement('@wipe/wipe-button').click();
        cy.task('pressYes');
    });

    // TODO: upload custom image
    // TODO: set auto-lock (needs pin)
});
