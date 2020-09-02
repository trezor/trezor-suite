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

    it('Success (basic)', () => {
        cy.getTestElement('@onboarding/path-used-button').click()
        cy.getTestElement('@onboarding/pair-device-step');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/only-backup-option-button').click();
        cy.task('pressYes');
        cy.getTestElement('@onboarding/exit-app-button');
    });
});
