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
    
    it('Device disconnected during action', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');
        cy.task('startEmu', { version: '2.1.4', wipe: false });
        cy.log(
            'If device disconnected during call, error page with retry button should appear. Also note, that unlike with T1, retry button initiates recoveryDevice call immediately',
        );
        cy.getTestElement('@onboarding/recovery/retry-button', { timeout: 10000 });
        // todo: clicking on retry button causes error, "unexpected message", only in tests, don't know why
    });
});
