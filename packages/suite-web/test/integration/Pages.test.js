describe('Pages', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/');
    });

    it(`test root onboarding page is online`, () => {
        cy.visit('/onboarding')
            .contains('Welcome to Trezor')
            .should('be.visible');
    });
});