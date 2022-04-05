// @group:settings
// @retry=2

describe('T2 - Device settings', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startBridge');
    });
    // cypress open todo: seems like entering urls (/settings/device) directly does not work anymore?
    it('change all possible device settings', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        // navigate to device settings page
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/device').click();

        // firmware modal
        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button').click({ scrollBehavior: false });
        cy.getTestElement('@modal/close-button').click();

        // change label
        cy.log('change label');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', 'My Trevor')
            .clear()
            .type('My Tenzor');
        cy.getTestElement('@settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // passphrase protection
        cy.log('turn on passphrase protection');
        cy.getTestElement('@settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // background
        cy.log('change background');
        cy.getTestElement('@settings/device/select-from-gallery')
            .click()
            .getTestElement(`@modal/gallery/t2/xmr`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        // display rotation
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
