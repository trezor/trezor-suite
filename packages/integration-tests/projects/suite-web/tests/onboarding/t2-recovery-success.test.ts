/* eslint-disable @typescript-eslint/camelcase */

// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet T2', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        // common steps - navigation through onboarding
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();
    });

    it('Success', () => {
        // using 2.1.4 firmware here. I don't know how to click on final screen after
        // recovery is finished on 2.3.1 atm
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
        cy.task('pressYes');
        cy.task('pressYes');
        cy.task('selectNumOfWordsEmu', 12);
        cy.task('pressYes');

        for (let i = 0; i <= 12; i++) {
            cy.task('inputEmu', 'all');
        }

        // this does nothing with 2.3.1
        cy.task('pressYes');

        // pin is tested in create path, so here we test 'skipping' path instead
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/pin');
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/final');
    });
});
