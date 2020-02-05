import CONSTANTS from '../../constants';
import { homescreensT2 } from '@suite-constants';

describe('Device settings', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        // navigate to device settings page
        cy.viewport(1024, 768).resetDb();

        cy.visit('/');

        cy.passThroughInitialRun();
        // make sure suite already sees device
        cy.getTestElement('@modal/connect-device').should('not.exist');
        cy.dashboardShouldLoad();
        cy.getTestElement('@suite/menu/settings')
            .click({ force: true })
            .getTestElement('@suite/settings/menu/device')
            .click({ force: true });
        // a little antipattern but perfection is the enemy of good.
        // there is a problem with device call in progress (from discovery)
        cy.wait(2000);
    });

    it('change all possible device settings and wipe device in the end', () => {
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

        // cy.log('open firmware modal and close it again');
        // cy.getTestElement('@settings/device/update-button')
        //     .click()
        //     .getTestElement('@modal/close')
        //     .click()
        //     .getTestElement('@modal/close')
        //     .should('not.exist');

        cy.log('wipe device');
        cy.getTestElement('@settings/device/wipe-button')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'wipeDevice' });
        cy.getTestElement('@button/go-to-onboarding').click();
        cy.onboardingShouldLoad();
    });

    it('Backup', () => {
        cy.getTestElement('@settings/device/check-seed-button').should('be.disabled');
        cy.getTestElement('@settings/device/failed-backup-row').should('not.exist');
        cy.getTestElement('@settings/device/create-backup-button').click();

        cy.log('Backup should reset when modal is closed');
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/start-button').should('not.be.disabled');
        cy.getTestElement('@backup/close-button').click();
        cy.getTestElement('@settings/device/create-backup-button').click();
        cy.getTestElement('@backup/start-button').should('be.disabled');

        cy.log('Backup button should be disabled until all checkboxes are checked');
        cy.getTestElement('@backup/start-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/start-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/start-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').should('not.be.disabled');

        cy.getTestElement('@backup/start-button').click();
        cy.getConfirmActionOnDeviceModal();

        // TODO: failed backup
        // TODO: success backup
    });

    // TODO: upload custom image
    // TODO: set pin part. need to extend python script to allow input digits on emulator
});
