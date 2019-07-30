const pages = ['/', '/bridge', '/onboarding', '/settings', '/version', '/wallet'];

describe('Pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    pages.forEach(page => {
        it(`test ${page} page is online`, () => {
            cy.visit(page)
                .get('html')
                .should('be.visible');
        });
    });
});
