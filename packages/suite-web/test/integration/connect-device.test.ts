describe('Connect device', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
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
