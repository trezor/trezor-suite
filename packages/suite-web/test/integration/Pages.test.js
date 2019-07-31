describe('Pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    it(`test root page is online`, () => {
        cy.visit('/')
            .get('html')
            .should('be.visible');
    });
});