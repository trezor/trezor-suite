describe('Log', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.visit('/settings');
        cy.task('stopBridge');
        cy.task('startBridge');
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.passThroughInitialRun();
    });

    it('open log modal', () => {
        cy.getTestElement('@settings/menu/log').click();
        cy.getTestElement('@log/copy-button');
        // todo: check that we really copied something;
    });
});
