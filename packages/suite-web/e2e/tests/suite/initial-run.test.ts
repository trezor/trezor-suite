// @group:suite
// @retry=2

describe('Suite initial run', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('Until user passed through initial run, it will be there after reload', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@analytics/toggle-switch').should('be.visible');
        cy.reload();
        // analytics screen is there until user confirms his choice
        cy.getTestElement('@analytics/toggle-switch').should('be.visible');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.reload();
        cy.getTestElement('@analytics/toggle-switch').should('not.exist');
        cy.getTestElement('@onboarding/exit-app-button').should('be.visible');
    });

    it('Once user passed trough, skips initial run and shows connect-device modal', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@onboarding/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.discoveryShouldFinish();
        cy.reload();
        cy.discoveryShouldFinish();
    });
});
