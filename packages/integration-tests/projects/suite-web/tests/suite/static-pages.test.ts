// @group:suite
// @retry=2

describe('Static pages accessible even without device', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('/bridge', () => {
        cy.prefixedVisit('/bridge');
        cy.get('html').should('contain', 'bridge');
        cy.getTestElement('@bridge').matchImageSnapshot({
            blackout: ['[data-test="@bridge/loading"]'],
        });
    });

    it('/version', () => {
        cy.prefixedVisit('/version');
        cy.get('html').should('contain', 'version');
        cy.getTestElement('@version').matchImageSnapshot({
            blackout: ['[data-test="@version/commit-hash-link"]'],
        });
    });
});
