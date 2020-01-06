import CONSTANTS from '../../constants';
import { homescreensT2 } from '@suite-constants';
// ../../../../packages/suite/src/constants/suite
describe('Device settings', () => {
    // Note that running this beforeEach makes tests run about 5 (I guess) times longer. I disagree with such practice
    beforeEach(() => {
        cy.task('startBridge')
            .task('startEmu')
            .task('setupEmu');
        cy.viewport(1024, 768).resetDb();

        // navigate to device settings page
        cy.visit('/')
            .onboardingShouldLoad()
            .getTestElement('button-use-wallet')
            .click()
            .walletShouldLoad()
            .getTestElement('@suite/menu/settings')
            .click({ force: true })
            .getTestElement('@suite/settings/menu/device')
            .click();
        // TODO: a little antipattern but perfection is the enemy of good.
        // there is a problem with device call in progress (from discovery)
        cy.wait(2000);
    });

    it('change device label', () => {
        cy.getTestElement('@suite/settings/device/label-input')
            .should('have.value', CONSTANTS.DEFAULT_TREZOR_LABEL)
            .clear()
            .type('My Tenzor');

        cy.getTestElement('@suite/settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it('turn on passphrase protection', () => {
        cy.getTestElement('@suite/settings/device/passphrase-switch')
            // TODO: find a way how to remove force: true
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it('change background', () => {
        cy.getTestElement('@suite/settings/device/select-from-gallery')
            .click()
            // might be nice to try all! I would even like to employ random choice from all possibilities
            // but this would cause heart attack to reviewers
            .getTestElement(`@modal/gallery/t2/${homescreensT2[4]}`)
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it('change display rotation', () => {
        cy.getTestElement('@suite/settings/device/rotation-button/90')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it('wipe device', () => {
        cy.getTestElement('@suite/settings/device/wipe-button')
            .click()
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'wipeDevice' });
        cy.getTestElement('@modal/disconnect-device');
    });

    // TODO: upload custom image
    // TODO: set pin part. need to extend python script to allow input digits on emulator
    // TODO: change rotation
});
