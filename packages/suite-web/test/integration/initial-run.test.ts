describe('Initial run', () => {
    beforeEach(() => {
        cy.resetDb().viewport(1024, 768);
    });

    it(`on first page load, user should be redirected to onboarding page, then he clicks 'use wallet now', reloads. Should not be redirected again`, () => {
        cy.visit('/')
            .get('html')
            .should('contain', 'Welcome to Trezor')
            .getTestElement('button-use-wallet')
            .click()
            .get('html')
            .should('contain', 'Connect Trezor to continue')
            .reload()
            .get('html')
            .should('contain', 'Connect Trezor to continue');
    });
});
