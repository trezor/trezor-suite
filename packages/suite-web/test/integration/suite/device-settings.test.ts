import CONSTANTS from '../../constants';

describe('Device settings happy path', () => {
    before(() => {
        cy.task('startBridge')
            .task('startEmu')
            .task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    // after(() => {
    //     cy.task('stopEmu').task('stopBridge');
    // });

    it('navigate to device settings page', () => {
        cy.visit('/')
            .onboardingShouldLoad()
            .getTestElement('button-use-wallet')
            .click()
            .walletShouldLoad()
            .toggleDeviceMenu()
            .getTestElement('@suite/menu-item/device-settings')
            .click();
    });

    it('change device label', () => {
        cy.getTestElement('@suite/device-settings/label-input')
            .should('have.value', CONSTANTS.DEFAULT_TREZOR_LABEL)
            .clear()
            .type('My Tenzor');
        cy.getTestElement('@suite/device-settings/label-submit')
            .click()
            .getConfirmActionOnDeviceModal();

        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it.skip('turn on pin protection', () => {
        // TODO: set pin part. need to extend python script to allow input digits on emulator
        // cy
        //     .getTestElement('@suite/modal/confirm-action-on-device').should('not.be.visible')
        //     .getTestElement('@suite/device-settings/pin-switch')
        //     .click({ force: true })
        //     .getTestElement('@suite/modal/confirm-action-on-device');
        // cy.task('sendDecision', { method: 'applySettings' });
        // cy
        //     .getTestElement('@suite/modal/confirm-action-on-device').should('not.be.visible')
    });

    it('turn on passphrase protection', () => {
        cy.getTestElement('@suite/device-settings/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });
});
