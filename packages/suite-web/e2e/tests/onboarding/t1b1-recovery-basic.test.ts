// @group:device-management
// @retry=2

// todo: this started to fail mysteriously after merging new base image. Skipping it for now and will investigate.
describe.skip('Onboarding - recover wallet T1B1', () => {
    before(() => {
        cy.task('startEmu', { version: '1-latest', wipe: true });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.task('startEmu', { wipe: true });
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();
        cy.onboardingShouldLoad();
        // common steps - navigation through onboarding
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step').click();
    });

    it('Incomplete run of basic recovery', () => {
        cy.getTestElement('@onboarding/button-continue').click();
        cy.getTestElement('@firmware/continue-button').click();
        cy.getTestElement('@recover/select-count/24').click();
        cy.getTestElement('@recover/select-type/basic').click();

        // trezord error, try wait
        cy.wait(2000);
        cy.task('pressYes');

        cy.getTestElement('@word-input-select/input').type('all');
        cy.getTestElement('@word-input-select/option/all').click();

        for (let i = 0; i < 23; i++) {
            cy.getTestElement('@word-input-select/input').type('all{enter}');
        }

        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/final');
    });
});

export {};
