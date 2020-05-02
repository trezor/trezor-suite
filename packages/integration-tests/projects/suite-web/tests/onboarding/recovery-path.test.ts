/* eslint-disable @typescript-eslint/camelcase */

describe('Recovery path', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('go directly through recovery', () => {
        cy.visit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();

        // using 2.1.4 firmware here. I don't know how to click on final screen after
        // recovery is finished on 2.3.0 atm
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-action-on-device').should('be.visible');
        cy.task('sendDecision');
        cy.task('sendDecision');
        cy.task('selectNumOfWordsEmu', 12);
        cy.task('sendDecision');

        for (let i = 0; i <= 12; i++) {
            cy.task('inputEmu', 'all');
        }

        // this does nothing with 2.3.0
        cy.task('sendDecision');

        // pin is tested in create path, so just check that continue button leads to pin
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/pin');
    });
});
