// @group:onboarding
// @retry=2

describe.skip('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.wait(1000);
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
    });

    it('Success (basic)', () => {
        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');
        
        cy.task('startEmu', { version: '1.9.0', wipe: true });
        cy.wait(1000);

        // does it take longer for t1 to get detected?
        // seems to be ok, maybe even this wait is not needed
        cy.wait(1000); // try wait.
        cy.getTestElement('@onboarding/button-continue', { timeout: 20000 }).click();
        cy.getTestElement('@firmware/skip-button').click();

        // todo: this sometimes fails with "device disconnected during action";
        // todo: adding huge wait here and see if it does something
        cy.wait(5000);
        cy.getTestElement('@onboarding/only-backup-option-button').click();

        cy.task('pressYes');

        cy.getTestElement('@onboarding/exit-app-button');
        cy.log('It is possible to leave onboarding now');

        cy.getTestElement('@onboarding/continue-to-security-button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').click();

        for (let i = 0; i < 48; i++) {
            cy.task('pressYes');
        }

        cy.getTestElement('@backup/close-button').should('be.disabled');
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();
        cy.getTestElement('@backup/close-button').click();

        cy.log('Now we are in PIN step, skip button is available');
        cy.getTestElement('@onboarding/skip-button').should('be.visible');

        cy.log('Lets set PIN');
        cy.getTestElement('@onboarding/set-pin-button').click();
        cy.task('pressYes');

        cy.log('PIN mismatch for now will be enough');
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch');
        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.task('pressYes');

        cy.log('Pin matrix appears again');
        cy.getTestElement('@pin/input/1');
    });
});
