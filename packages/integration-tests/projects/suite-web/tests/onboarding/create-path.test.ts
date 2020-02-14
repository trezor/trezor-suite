/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding happy paths', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it(`Create new wallet direct path through onboarding`, () => {
        cy.visit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad()
            .getTestElement('@onboarding/begin-button')
            .click()
            //  add snapshots in distant future when everything is stable
            // .matchImageSnapshot()
            .getTestElement('@onboarding/path-create-button')
            .click()
            .getTestElement('@onboarding/path-used-button')
            .click()
            .getTestElement('@onboarding/pair-device-step');

        cy.task('startEmu');

        cy.getTestElement('@onboarding/button-continue')
            .click()
            .getTestElement('@onboarding/button-continue')
            .click()
            .getTestElement('@onboarding/button-standard-backup')
            .click()
            .getTestElement('@onboading/confirm-action-on-device')
            .should('be.visible');
        cy.task('sendDecision');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        // todo: PIN has problem in CI, need help
        // cy.getTestElement('@onboarding/set-pin-button').click();
        // cy.task('sendDecision');
        // cy.task('inputEmu', '1');
        // cy.task('inputEmu', '1');
        // cy.getTestElement('@onboarding/pin/continue-button').click();
    });
});
