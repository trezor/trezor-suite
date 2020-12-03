/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
    });

    it('Success (no shamir capability)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.log(
            'Note that this firmware does not have Shamir capability so we show only single backup option button',
        );
        cy.getTestElement('@onboarding/only-backup-option-button').click();
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

    it('Success (Shamir capability)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/continue-button').click();

        cy.log(
            'Note that this firmware does not have Shamir capability so we show only single backup option button',
        );
        cy.getTestElement('@onboarding/button-standard-backup').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        cy.passThroughSetPin();

        cy.getTestElement('@onboarding/final');
    });
});
