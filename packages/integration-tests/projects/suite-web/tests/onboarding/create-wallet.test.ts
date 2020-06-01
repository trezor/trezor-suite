/* eslint-disable @typescript-eslint/camelcase */

// @beta

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

    // todo: { wipe: true } does not work now with model 1
    it('Model 1', () => {
        cy.getTestElement('@onboarding/path-used-button').click()
        cy.getTestElement('@onboarding/pair-device-step');
        cy.task('startEmu', { version: '1.8.3', wipe: true });
    })

    it(`Model T`, () => {
       
        cy.getTestElement('@onboarding/path-used-button').click()
        cy.getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click()
        cy.getTestElement('@onboarding/button-continue').click()
        
        cy.log('Note that this firmware does not have Shamir capability so we show only single backup option button');
        cy.getTestElement('@onboarding/only-backup-option-button').click()
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('sendDecision');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.task('inputEmu', '1');
        cy.task('inputEmu', '1');
        cy.getTestElement('@onboarding/pin/continue-button').click();
        cy.getTestElement('@onboarding/final');
    });
});
