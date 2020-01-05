const fixtures = [
    {
        visit: '/bridge',
        should: ['contain', 'bridge'],
    },
    {
        visit: '/version',
        should: ['contain', 'version'],
    },
    {
        visit: '/onboarding',
        should: ['contain', 'Welcome to Trezor'],
    },
] as const;

describe('Static pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    fixtures.forEach(f => {
        it(`test ${f.visit} page is online`, () => {
            cy.visit(f.visit)
                .get('html')
                .should(f.should[0], f.should[1]);
        });
    });
});
