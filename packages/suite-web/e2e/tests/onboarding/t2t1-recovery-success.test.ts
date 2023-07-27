// @group:onboarding
// @retry=2

describe('Onboarding - recover wallet TT', () => {
    beforeEach(() => {
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');

        cy.task('startEmu', { wipe: true, version: '2.4.3' });
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
        cy.wait(1000);
        cy.task('pressYes');

        // pin is tested in create path, so here we test 'skipping' path instead
        cy.getTestElement('@onboarding/recovery/continue-button').click();
        cy.getTestElement('@onboarding/skip-button').click();
    });
});

export {};
