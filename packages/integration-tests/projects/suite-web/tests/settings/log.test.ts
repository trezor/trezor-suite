// @group:suite
// @retry=2

describe('Log', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings');
        cy.passThroughInitialRun();
    });

    it('open log modal', () => {
        cy.getTestElement('@settings/menu/dropdown').click();
        cy.getTestElement('@settings/menu/log').click();
        cy.getTestElement('@log/copy-button');
        // todo: check that we really copied something;
    });
});
