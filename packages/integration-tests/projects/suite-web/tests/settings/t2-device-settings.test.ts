// @group:settings
// @retry=2

describe('T2 - Device settings', () => {
    it('change all possible device settings', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');

        // navigate to device settings page
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button').click();
        cy.getTestElement('@modal/close-button').click();

        cy.log('turn on passphrase protection');
        cy.getTestElement('@settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        cy.log('change background');
        cy.getTestElement('@settings/device/select-from-gallery')
            .click()
            .getTestElement(`@modal/gallery/t2/xmr`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

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

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click();
        cy.getTestElement('@backup');
    });

    it.only('does not show auto-lock select because it is not supported on fw <2.3.5 ', () => {
        cy.task('startEmu', { wipe: true, version: '2.3.4' });
        cy.task('setupEmu');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();

        // TODO - add pin to verify it properly

        cy.getTestElement('@settings/auto-lock-select/input').should('not.exist');
    });

    it('wipe device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        cy.viewport(1024, 768).resetDb();
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
