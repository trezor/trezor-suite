// @beta

describe('Metadata', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('stopEmu');
        cy.viewport(1024, 768).resetDb();
        cy.passThroughInitialRun();
    });

    it('??', () => {
        cy.getTestElement('@analytics/toggle-switch').should('be.checked');
    });
});
