// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet T2T1', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');

        cy.task('startEmu', { wipe: true, version: '2.5.3' });
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@analytics/continue-button').click();

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

        for (let i = 0; i < 12; i++) {
            cy.task('inputEmu', 'all');
        }

        // pressing the final Continue button
        cy.wait(1500);
        cy.task('pressYes');

        // pin is tested in create path, so here we test 'skipping' path instead
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
        cy.getTestElement('@onboarding/skip-button-confirm').click();
    });
});

export {};
