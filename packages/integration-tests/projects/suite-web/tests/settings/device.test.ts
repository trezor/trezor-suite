import CONSTANTS from '../../constants';
import { homescreensT2 } from '@suite-constants';

describe('Device settings', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        // navigate to device settings page
        cy.viewport(1024, 768).resetDb();
        cy.visit('/settings/device');
        cy.passThroughInitialRun();
        // make sure suite already sees device
        cy.getTestElement('@modal/connect-device').should('not.exist');
    });

    it('change all possible device settings', () => {
        cy.log('change label');
        cy.getTestElement('@settings/device/label-input')
            .should('have.value', CONSTANTS.DEFAULT_TREZOR_LABEL)
            .clear()
            .type('My Tenzor');

        cy.getTestElement('@settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        cy.log('turn on passphrase protection');
        cy.getTestElement('@settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        cy.log('change background');
        cy.getTestElement('@settings/device/select-from-gallery')
            .click()
            .getTestElement(`@modal/gallery/t2/${homescreensT2[4]}`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        cy.log('change display rotation');
        cy.getTestElement('@settings/device/rotation-button/90')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.exist');

        cy.log('open firmware modal and close it again');
        cy.getTestElement('@settings/device/update-button').click();
        cy.getTestElement('@firmware/close-button').click();
    });

    it('backup in settings', () => {
        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click();
        cy.getTestElement('@backup');
    });

    it('wipe device', () => {
        cy.getTestElement('@settings/device/open-wipe-modal-button').click();
        cy.getTestElement('@wipe/checkbox-1').click();
        cy.getTestElement('@wipe/checkbox-2').click();
        cy.getTestElement('@wipe/wipe-button').click();
        cy.task('sendDecision');
    });

    // TODO: upload custom image
    // TODO: set pin part. need to extend python script to allow input digits on emulator
});
