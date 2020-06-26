/* eslint-disable @typescript-eslint/camelcase */

// @beta 
// @retry=2

describe('Onboarding - recover wallet T1', () => {
    before(() => {
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

    it('Incomplete run of basic recovery', () => {
        // todo: acquire device problem with model T1 emu, but why? stop and start bridge is sad workaround :(
        cy.task('stopBridge');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.task('startBridge');

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/basic').click();
        cy.task('sendDecision');
        
        cy.getTestElement('@word-input-select/input').type('all');
        cy.getTestElement(
            '@word-input-select/option/all'
        ).click();

        for (let i = 0; i < 23; i++) {
            cy.getTestElement('@word-input-select/input').type('all{enter}');
        }
        
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/final');
    });
});
