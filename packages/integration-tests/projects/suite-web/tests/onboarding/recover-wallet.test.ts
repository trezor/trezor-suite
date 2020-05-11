/* eslint-disable @typescript-eslint/camelcase */

describe('Onboarding - recover wallet', () => {
    beforeEach(() => {
        cy.task('stopEmu');
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

    it('Model T - success', () => {
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

    it('Model T - device disconnected', () => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });

        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-action-on-device');
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

    // todo: test flaky: device disconnected during action error
    it.skip('Model 1', () => {
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
        // todo: figure out how to work with select in tests
    });
});
