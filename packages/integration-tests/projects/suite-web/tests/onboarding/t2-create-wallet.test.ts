/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
    });

    it('Success (no shamir capability, backup and PIN from happy path)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.task('wipeEmu');

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.log(
            'Note that this firmware does not have Shamir capability so we show only single backup option button',
        );
        cy.getTestElement('@onboarding/create-new-wallet-option-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        // Note that cy.passThroughSetPin is not used here. Fw version 2.1.4 does not
        // display a success screen that needs press_yes
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.task('inputEmu', '1');
        cy.task('inputEmu', '1');
        // latest (2.3.4 at time of writing) needs press_yes here
        cy.getTestElement('@onboarding/pin/continue-button').click();
        cy.getTestElement('@onboarding/final');
    });

    it('Success (no shamir capability, backup and PIN from settings)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.task('wipeEmu');

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.log(
            'Note that this firmware does not have Shamir capability so we show only single backup option button',
        );
        cy.getTestElement('@onboarding/create-new-wallet-option-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.log('leaving onboarding now, backup will continue from settings');

        cy.wait(2000);

        cy.getTestElement('@notification/no-backup/button').click();
        cy.wait(2000);

        cy.passThroughSettingsBackup();

        // Note that cy.passThroughSetPin is not used here. Fw version 2.1.4 does not
        // display a success screen that needs press_yes
        cy.wait(2000);
        cy.task('pressYes') 
        cy.wait(2000);
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('inputEmu', '1');
        cy.wait(2000);
        cy.task('inputEmu', '1');
        cy.wait(2000);
        // latest (2.3.4 at time of writing) needs press_yes here
    });

    it('Success (Shamir capability no backup)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { wipe: true });


        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.log(
            'Note that this firmware has Shamir capability',
        );
        cy.getTestElement('@onboarding/button-shamir-backup').click();
        cy.task('pressYes');
      //  cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.wait(1000); 
        cy.task('pressYes');
        cy.wait(1000); 

        cy.getTestElement('@onboarding/exit-app-button').click();

        // TO DO pass through Shamir backup (add new def for trezor-user-env that will be used here 
        //  NOTE that passThroughBackup() does not work for Shamir
        // cy.getTestElement('@onboarding/continue-to-security-button').click();
        //cy.getTestElement('@backup/check-item/has-enough-time');
        //cy.getTestElement('@backup/check-item/is-in-private');
        // cy.getTestElement('@backup/check-item/understands-what-seed-is');
        // cy.getTestElement('@backup/start-button');
        // cy.wait(5000);

      
        //cy.passThroughBackupShamir();

      //  cy.passThroughSetPin();

       // cy.getTestElement('@onboarding/final');
    });
});
