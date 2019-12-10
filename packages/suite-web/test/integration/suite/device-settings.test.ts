import CONSTANTS from '../../constants';

// todo: does not work now as device settings is not available in the new design yet.
describe('Device settings happy path', () => {
    // Note that running this beforeEach makes tests run about 5 (I guess) times longer.
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
    });

    after(() => {
        cy.task('stopEmu').task('stopBridge');
    });

    it('change device label', () => {
        cy.getTestElement('@suite/settings/device/label-input')
            .should('have.value', CONSTANTS.DEFAULT_TREZOR_LABEL)
            .clear()
            .type('My Tenzor');

        // TODO:
        // there is probably a short period of time before discovery-stop event
        // is propagated and cypress sometimes is fast enough to run into
        // call in progress error;
        // It is probably enough to implement device lock.
        // cy.wait(1000);
        cy.getTestElement('@suite/settings/device/label-submit').click();
        cy.getConfirmActionOnDeviceModal();

        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    it('turn on passphrase protection', () => {
        cy.getTestElement('@suite/settings/device/passphrase-switch')
            .click({ force: true })
            .getConfirmActionOnDeviceModal();
        cy.task('sendDecision', { method: 'applySettings' });
        cy.getConfirmActionOnDeviceModal().should('not.be.visible');
    });

    // TODO: set pin part. need to extend python script to allow input digits on emulator
    // it.skip('turn on pin protection', () => {
    //     cy
    //         .getTestElement('@suite/modal/confirm-action-on-device').should('not.be.visible')
    //         .getTestElement('@suite/settings/device/pin-switch')
    //         .click({ force: true })
    //         .getTestElement('@suite/modal/confirm-action-on-device');
    //     cy.task('sendDecision', { method: 'applySettings' });
    //     cy
    //         .getTestElement('@suite/modal/confirm-action-on-device').should('not.be.visible')
    // });

    // TODO: change rotation
    // TODO: change background
});
