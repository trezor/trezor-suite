/* eslint-disable @typescript-eslint/naming-convention */

// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet T2', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');

        // using 2.1.4 firmware here. I don't know how to click on final screen after
        // recovery is finished on 2.3.1 atm
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@firmware/skip-button').click();
        cy.getTestElement('@onboarding/path-recovery-button').click();
    });

    it('Success', () => {
        cy.getTestElement('@onboarding/recovery/start-button').click();
        cy.getTestElement('@onboarding/confirm-on-device').should('be.visible');
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);
        cy.task('selectNumOfWordsEmu', 12);
        cy.wait(1000);
        cy.task('pressYes');
        cy.wait(1000);

        for (let i = 0; i <= 12; i++) {
            cy.task('inputEmu', 'all');
        }

        // this does nothing with 2.3.1
        cy.task('pressYes');

        // pin is tested in create path, so here we test 'skipping' path instead
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
    });
});
