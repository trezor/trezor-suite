describe('Onboarding', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/onboarding');
    });

    it(`test root onboarding page is online`, () => {
        cy.visit('/onboarding')
            .get('html')
            .should('be.visible');

        cy.getTestElement('button-create').click();

        cy.get('body').should('contain', 'Do you want to use new or used device?');

        cy.getTestElement('button-new-device').click();

        cy.get('body').should('contain', 'Select your device');

        cy.getTestElement('select-device-1').click();

        cy.get('body').should('contain', 'Hologram check');
    });
});
