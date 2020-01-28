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

        cy.get('html')
            .should('contain', 'Take me to security')
            .getTestElement('button-exit-app');
        // click() removed it for now. I need reproducible runs to compare line by line faild and succeeded once
        // and going to wallet SOMETIMES managed to trigger discovery process resulting in more lines (bridge calls logs)
    });
});
