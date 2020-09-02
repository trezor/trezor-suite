/* eslint-disable @typescript-eslint/camelcase */

// @stable/device-management
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click()
    });

    it('Success', () => {
       
        cy.getTestElement('@onboarding/path-used-button').click()
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click()
        cy.getTestElement('@onboarding/button-continue').click()
        
        cy.log('Note that this firmware does not have Shamir capability so we show only single backup option button');
        cy.getTestElement('@onboarding/only-backup-option-button').click()
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('pressYes');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.task('inputEmu', '1');
        cy.task('inputEmu', '1');
        cy.getTestElement('@onboarding/pin/continue-button').click();
        cy.getTestElement('@onboarding/final');
    });
});
