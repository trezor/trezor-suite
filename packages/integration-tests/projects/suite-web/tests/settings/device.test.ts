// @group:suite
// @retry=2

describe('Device settings', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        // navigate to device settings page
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/device');
        cy.passThroughInitialRun();
    });

    it('change all possible device settings', () => {
        cy.task('startEmu', { wipe: true, version: '2.1.4' });
        cy.task('setupEmu');

        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button').click();
        cy.getTestElement('@modal/close-button').click();

        cy.log('change label');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', 'My Trevor')
            .clear()
            .type('My Tenzor');

        cy.getTestElement('@settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('pressYes');
        cy.getConfirmActionOnDeviceModal().should('not.exist');

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

        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click();
        cy.getTestElement('@backup');
    });

    it('wipe device', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');

        cy.getTestElement('@settings/device/open-wipe-modal-button').click();
        cy.getTestElement('@wipe/checkbox-1').click();
        cy.getTestElement('@wipe/checkbox-2').click();
        cy.getTestElement('@wipe/wipe-button').click();
        cy.task('pressYes');
    });

    it.skip('t1 - pin mismatch', () => {
        // todo: acquire device problem with model T1 emu, but why? stop and start bridge is sad workaround :(
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.getTestElement('@settings/device/pin-switch').click({ force: true });
        cy.task('pressYes');
        // todo: add support for pin to trezor-user-env. now I may safely test only wrong pin input
        cy.getTestElement('@pin-input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.log('enter 2 digits instead of 1 in the first entry. This way pin is always wrong');
        cy.getTestElement('@pin-input/1').click();
        cy.getTestElement('@pin-input/1').click();

        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch');
        cy.getTestElement('@pin-mismatch/try-again-button').click();
    });

    // TODO: upload custom image
    // TODO: t1 - pin success
    // TODO: t1 - pin caching immediately after it is set
});
