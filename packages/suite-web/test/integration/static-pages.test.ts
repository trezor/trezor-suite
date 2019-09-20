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
    {
        visit: '/firmware',
        should: ['contain', 'Firmware'],
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

    it(`on first page load, user should be redirected to onboarding page, then he clicks 'use wallet now' and connects device`, () => {
        cy.dispatchDeviceConnect().then(dispatch => {
            cy.visit('/')
                .get('html')
                .should('contain', 'Welcome to Trezor')
                .window()
                .its('store')
                .invoke('dispatch', dispatch)
                .getTestElement('button-use-wallet')
                .click()
                // todo: add snapshots in distance future when everything is stable
                // .matchImageSnapshot()
                .get('html')
                .should('contain', 'Please select your coin');
        });
    });
});
