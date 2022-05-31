// @group:suite
// @retry=2

describe('Portfolio graph check', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case
    1. Pass onboarding
    2. Load dashboard
    3. Assert Portfolio graph exists
    4. Hover over part of graph to trigger detail value
    */
    it('Portfolio check', () => {
        //
        // Test preparation
        //
        const rechartscells = 'path[fill^="url"]';

        //
        // Test execution
        //
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');
        // when graph becomes visible, discovery was finished
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');
        cy.get(rechartscells).first().click();

        //
        // Assert
        //
        cy.getTestElement('@dashboard/customtooltip').should('be.visible');
    });
});
