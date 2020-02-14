/* eslint-disable @typescript-eslint/camelcase */

describe('Recovery path', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('go directly through recovery', () => {
        cy.visit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/button-begin').click();
        cy.getTestElement('@onboarding/button-path-recovery').click();
        cy.getTestElement('@onboarding/button-used-path').click();
        cy.getTestElement('@onboarding/pair-device-step').click();

        cy.task('startEmu');

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboading/confirm-action-on-device').should('be.visible');
        cy.task('sendDecision');
        cy.task('sendDecision');
        cy.task('selectNumOfWordsEmu', 12);
        cy.task('sendDecision');

        for (let i = 0; i <= 12; i++) {
            cy.task('inputEmu', 'all');
        }

        cy.task('sendDecision');

        // pin is tested in create path, so just check that continue button leads to pin
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/pin');
    });
});
