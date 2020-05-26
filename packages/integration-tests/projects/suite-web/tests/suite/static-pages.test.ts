const fixtures = [
    {
        visit: '/bridge',
        should: ['contain', 'Trezor Bridge'],
    },
    {
        visit: '/version',
        should: ['contain', 'version'],
    },
] as const;

describe('Static pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    fixtures.forEach(f => {
        it(`test ${f.visit} page is online`, () => {
            cy.visit(f.visit)
        
            // now there is temporary landing page until we go stable. modals will take precedence then
            cy.getTestElement('@landing/continue-in-browser-button').click();
            
            cy.get('html').should(f.should[0], f.should[1]);
        });
    });
});
