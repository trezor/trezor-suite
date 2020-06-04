/* eslint-disable @typescript-eslint/camelcase */

// @beta 

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

    it('Success', () => {
        // using 2.1.4 firmware here. I don't know how to click on final screen after
        // recovery is finished on 2.3.0 atm
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('be.visible');
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

    it('Device disconnected during action', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.task('stopEmu');
        cy.getTestElement('@onboarding/unexpected-state/reconnect');
        cy.task('startEmu', { version: '2.1.4', wipe: false });
        cy.log(
            'If device disconnected during call, error page with retry button should appear. Also note, that unlike with T1, retry button initiates recoveryDevice call immediately',
        );
        cy.getTestElement('@onboarding/recovery/retry-button');
        // todo: clicking on retry button causes error, "unexpected message", only in tests, don't know why
    });
});
