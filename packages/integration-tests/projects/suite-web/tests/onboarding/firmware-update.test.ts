// @group:onboarding
// @retry=2

const { getSuiteDevice } = global.JestMocks;

describe('Onboarding - firmware update', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('firmware update error', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();

        cy.getTestElement('@firmware/skip-button');
        cy.getTestElement('@firmware/get-ready-button').click();
        cy.getTestElement('@firmware/reconnect-device/bootloader');
        cy.task('stopEmu');

        cy.connectBootloaderDevice('1');
        cy.getTestElement('@firmware/install-button').click();

        cy.log('Error screen appears with retry button');
        cy.getTestElement('@firmware/retry-button');
        
        // this simulates that device lost its firmware
        
        // now there is retry button which should retry firmware update right away

        // and back button which reset state of firmware update and brings user back to initial screen
        // cy.getTestElement('@onboarding/back-button').click();
        // cy.getTestElement('@firmware/install-button');

        // unrelated. see how fw update reacts to ButtonRequest_FirmwareCheck button request 
        // cy.dispatch({
        //     type: 'ui-button',
        //     payload: { code: 'ButtonRequest_FirmwareCheck', device: getSuiteDevice() },
        // });
        // cy.getTestElement('@suite/modal/confirm-fingerprint-on-device');
        // cy.matchImageSnapshot('firmware-confirm fingerprint');
    });
});
