// @group:onboarding
// @retry=2

describe('Onboarding - create wallet', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
    });

    it('Success (basic)', () => {
        cy.task('startEmu', { version: '1.9.0', wipe: true })
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement("@firmware/skip-button").click();

        cy.getTestElement('@onboarding/path-create-button').click();
        cy.getTestElement('@onboarding/only-backup-option-button').click();

        // todo: this sometimes fails with "device disconnected during action";
        // todo: adding huge wait here and see if it does something
        cy.wait(5000);

        cy.task('pressYes');

        cy.getTestElement('@onboarding/skip-backup');
        cy.log('It is possible to leave onboarding now');
        
        cy.getTestElement('@onboarding/create-backup-button').click();
        
        // todo: these are "after checkboxes". is that correct?
        cy.getTestElement('@backup/check-item/wrote-seed-properly').click();
        cy.getTestElement('@backup/check-item/made-no-digital-copy').click();
        cy.getTestElement('@backup/check-item/will-hide-seed').click();
        cy.getTestElement('@backup/start-button').click();

        for (let i = 0; i < 48; i++) {
            cy.task('pressYes');
            cy.wait(100);
        }

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
