describe('Log', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
        cy.visit('/settings');
        cy.passThroughInitialRun();
    });

    it('open log modal', () => {
        cy.getTestElement('@settings/menu/log').click();
        cy.getTestElement('@log/copy-button');
        // todo: check that we really copied something;
    });
});
