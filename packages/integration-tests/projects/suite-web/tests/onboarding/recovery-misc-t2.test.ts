/* eslint-disable @typescript-eslint/camelcase */

// @beta 

describe('Onboarding - T2 in recovery mode', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        // start recovery with device
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.resetDb();
        cy.task('stopEmu');
        cy.task('startEmu', { wipe: false });
        cy.reload();
    });
    
    it('Initial run with device that is already in recovery mode', () => {
        cy.log('Welcome and analytics screen are not affected');
        cy.getTestElement('@welcome/continue-button').click();
        cy.getTestElement('@analytics/go-to-onboarding-button').click();
        cy.log('Once we get into first onboarding screen, we can see "recovery mode" with continue button, which brings user to recovery step in onboarding');
        cy.getTestElement('@device-invalid-mode/recovery/continue-button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision');
        cy.log('At this moment, recovery is running on device');
        // todo: stop recovery and check if back button works as expected in onboarding
    });
});
