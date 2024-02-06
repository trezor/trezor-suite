// @group:suite
// @retry=2

describe('Suite initial run', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
    });

    it('Until user passed through initial run, it will be there after reload', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@analytics/toggle-switch').should('be.visible');
        cy.safeReload();
        // analytics screen is there until user confirms his choice
        cy.getTestElement('@analytics/toggle-switch').should('be.visible');
        cy.getTestElement('@analytics/continue-button').click();
        cy.safeReload();
        cy.getTestElement('@analytics/toggle-switch').should('not.exist');
        cy.getTestElement('@onboarding/exit-app-button').should('be.visible');
    });

    it('Once user passed trough, skips initial run and shows connect-device modal', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button').click();
        cy.discoveryShouldFinish();
        cy.safeReload();
        cy.discoveryShouldFinish();
    });
});

export {};
