/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding - recover wallet', () => {
    beforeEach(() => {
        cy.task('stopEmu')
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        // common steps - navigation through onboarding
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();

    });

    it('Model 1', () => {
        cy.task('startEmu', { version: '1.8.3', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/basic').click();
        cy.task('sendDecision');
        // todo: @trezor/components Select does not allow data-test attribute now
    });

    it('Model T', () => {
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

        // pin is tested in create path, so here we test 'skipping' path instead
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/pin');
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/final');
    });
});
