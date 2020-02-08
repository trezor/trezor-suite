/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding happy paths', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('wipeEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
    });

    // todo: not finished up to the last step.
    it(`Create new wallet direct path through onboarding`, () => {
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
            .getTestElement('@onboarding/button-continue')
            .click()
            .getTestElement('@onboarding/button-standard-backup')
            .click()
            .getTestElement('@onboading/confirm-action-on-device')
            .should('be.visible');
        cy.task('sendDecision', 'resetDevice');

        cy.getTestElement('@onboarding/continue-to-security-button').click();

        cy.passThroughBackup();

        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.task('sendDecision');
        // cy.task('enterPinEmu');
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();
    });
});

// todo Recover wallet direct path through onboarding
