/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding happy paths', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it(`create new wallet - skip security - appear in wallet`, () => {
        cy.visit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad()
            .getTestElement('@onboarding/button-begin')
            .click()
            //  add snapshots in distance future when everything is stable
            // .matchImageSnapshot()
            .getTestElement('@onboarding/button-path-create')
            .click()
            .getTestElement('@onboarding/button-used-path')
            .click()
            .getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu');

        cy.getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Get the latest firmware')
            .getTestElement('@onboarding/button-continue')
            .click()
            .get('html')
            .should('contain', 'Seed type')
            .getTestElement('@onboarding/button-standard-backup')
            .click()
            .getTestElement('@onboading/confirm-action-on-device')
            .should('be.visible');
        cy.task('sendDecision', 'resetDevice');

        cy.getTestElement('@onboarding/continue-to-security-button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
    });
});
