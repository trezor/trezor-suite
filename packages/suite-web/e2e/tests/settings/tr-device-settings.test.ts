// @group:settings
// @retry=2

// this test is only a proof of concept of how to run model R tests in suite and also how to run tests using url in general.
// TODOS:
// - focus this test on testing what is different from model T: (background image, display rotation)
// - implement these differences in suite in the first place. both suite and model R will happily accept
//   request to change display rotation but it has no effect. It should be at least hidden on client.
// https://github.com/trezor/trezor-suite/issues/6567

describe('TR - Device settings', () => {
    const startEmuOpts = {
        url: 'https://gitlab.com/satoshilabs/trezor/trezor-firmware/-/jobs/3104755066/artifacts/raw/core/build/unix/trezor-emu-core',
        model: 'R',
        wipe: true,
    };

    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startBridge');
    });

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

        cy.task('startEmuFromUrl', startEmuOpts);
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

        // change background
        cy.log('change background');
        cy.getTestElement('@settings/device/select-from-gallery')
            .click()
            .getTestElement(`@modal/gallery/t2/xmr`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        /* TODO It wants T images not 1 images in this version
        .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist'); */
    });

    it('backup in settings', () => {
        cy.task('startEmuFromUrl', startEmuOpts);
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
        cy.task('startEmuFromUrl', startEmuOpts);
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
});

export {};
