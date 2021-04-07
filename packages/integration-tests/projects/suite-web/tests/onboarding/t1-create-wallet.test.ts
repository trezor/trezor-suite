// @group:onboarding
// @retry=2

//need to add a stop for "backup failed"

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.goToOnboarding();
        cy.onboardingShouldLoad();
        cy.getTestElement('@onboarding/begin-button').click();
        cy.getTestElement('@onboarding/path-create-button').click();
    });

    it('Success (basic with backup and pin from happy path)', () => {
        cy.task('startEmu', { wipe: true, version: '1.9.0' });
        cy.task('wipeEmu');
        cy.wait(1000);    

        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');
        cy.wait(1000); 

        cy.wait(1000);
        cy.getTestElement('@onboarding/button-continue', { timeout: 20000 }).click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.wait(5000);
        cy.getTestElement('@onboarding/create-new-wallet-option-button').click();
        cy.wait(1000);
        cy.task('pressYes'); //ended here


        cy.getTestElement('@onboarding/exit-app-button');
        cy.log('It is possible to leave onboarding now');

        cy.getTestElement('@onboarding/continue-to-security-button').click();
        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').click();

        for (let i = 0; i < 48; i++) {
            cy.task('pressYes');
            cy.wait(100);
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
        cy.wait(2000);
        cy.task('pressYes');

        cy.log('PIN mismatch for now will be enough');
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.wait(5000);

        cy.getTestElement('@pin-mismatch');
        cy.wait(5000);

        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.wait(5000);
        cy.task('pressYes');
        cy.wait(5000);

        cy.log('Pin matrix appears again');
        cy.wait(5000);

        cy.task('pressYes');
        cy.wait(5000);

        cy.getTestElement('@pin/input/1');
    });

    it('Success (basic, backup and PIN from settings)', () => {
        cy.task('startEmu', { wipe: true, version: '1.9.0' });
        cy.task('wipeEmu');
        cy.wait(1000);    

        cy.getTestElement('@onboarding/path-used-button').click();
        cy.getTestElement('@onboarding/pair-device-step');
        cy.wait(1000); 

        cy.wait(1000);
        cy.getTestElement('@onboarding/button-continue', { timeout: 20000 }).click();
        cy.getTestElement('@firmware/skip-button').click();

        cy.wait(5000);
        cy.getTestElement('@onboarding/create-new-wallet-option-button').click();
        cy.wait(1000);
        cy.task('pressYes');

        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.log('leaving onboarding now, backup will continue from settings');

        cy.wait(2000);

        cy.getTestElement('@notification/no-backup/button').click();
        cy.wait(2000);


        cy.getTestElement('@backup/check-item/understands-what-seed-is').click();
        cy.getTestElement('@backup/check-item/has-enough-time').click();
        cy.getTestElement('@backup/check-item/is-in-private').click();
        cy.getTestElement('@backup/start-button').click();

        for (let i = 0; i < 48; i++) {
            cy.task('pressYes');
            cy.wait(100);
        }
    
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();


        cy.log('Now we are in PIN step, skip button is available');
        cy.getTestElement('@backup/close-button').should('be.visible');

        cy.log('Lets set PIN');
        cy.getTestElement('@backup/continue-to-pin-button').click();
        cy.wait(5000);
        cy.task('pressYes');

        cy.log('PIN mismatch for now will be enough');
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/input/1').click();
        cy.getTestElement('@pin/submit-button').click();
        cy.getTestElement('@pin-mismatch');
        cy.wait(2000);
        cy.getTestElement('@pin-mismatch/try-again-button').click();
        cy.wait(5000);

        cy.log('Pin matrix appears again');
        cy.task('pressYes');
        cy.wait(2000);
    });
});
