// @group:suite

describe.skip('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: '2.1.4', wipe: true });
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('Go to dashboard and check that loading status turns off after discovery is finished', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/loading', { timeout: 30000 }).should('not.be.visible');
        cy.getTestElement('@dashboard/loading').should('be.visible');
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('be.visible');
    });

    it('Security cards. Backup button should open backup modal', () => {
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@dashboard/security-card/backup/button').click();
        cy.getTestElement('@backup');
    });
});
