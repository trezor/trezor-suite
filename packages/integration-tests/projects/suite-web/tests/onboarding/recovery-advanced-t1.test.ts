/* eslint-disable @typescript-eslint/camelcase */

// @beta 
// @retry=2

describe('Onboarding - recover wallet T1', () => {
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

    it('Incomplete run of advanced recovery', () => {
        // todo: acquire device problem with model T1 emu, but why? stop and start bridge is sad workaround :(
        cy.task('stopBridge');
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.task('startBridge');

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/advanced').click();
        cy.task('sendDecision');

        cy.log('typical user starts doing the T9 craziness');
        for (let i = 0; i <= 4; i++) {
            cy.getTestElement('@recovery/word-input-advanced/1').click({ force: true });
        }
        cy.log(
            'but after a while he finds he has no chance to finish it ever, so he disconnects device as there is no cancel button',
        );

        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');
        cy.task('startEmu', { version: '1.9.0', wipe: false });
        cy.getTestElement('@onboarding/recovery/retry-button').click();

        cy.getTestElement('@recover/select-count/12').click();
        cy.getTestElement('@recover/select-type/basic').click();

        cy.task('sendDecision');
        cy.getTestElement('@recovery/word');
    });
});
