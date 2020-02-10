describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('Go to dashboard and check that loading status turns off after discovery is finished', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/loading').should('not.be.visible');
        cy.getTestElement('@dashboard/loading').should('be.visible');
        cy.getTestElement('@dashboard/wallet-ready').should('be.visible');
    });

    it('Security cards. Backup button should open backup modal', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@dashboard/security-card/backup/button').click();
        cy.getTestElement('@backup');
    });
});
