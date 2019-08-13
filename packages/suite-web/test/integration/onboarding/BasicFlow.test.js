describe('Basic onboarding flow', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).visit('/onboarding');
    });

    // just some change to trigger ci. 
    
    it(`used device skips device selection and hologram step`, () => {
            cy.get('html')
            .should('contain', 'Welcome to Trezor')
            .getTestElement('button-path-create')
            .click()
            
            // new or used screen
            .get('html')
            .should('contain', 'Do you want to use new or used device')
            .getTestElement('button-used-path')
            .click()

            // bridge step
            .get('html')
            .should('contain', 'Trezor Bridge');
    });


    it(`new device has additional steps - device selection and hologram`, () => {
        cy.get('html')
        .should('contain', 'Welcome to Trezor')
        .getTestElement('button-path-create')
        .click()
        
        // new or used screen
        .get('html')
        .should('contain', 'Do you want to use new or used device')
        .getTestElement('button-new-path')
        .click()

        // bridge step
        .get('html')
        .should('contain', 'Select your device')
        .getTestElement('option-model-one-path')
        .click()
        .get('html')
        .should('contain', 'Hologram')
        .getTestElement('button-continue')
        .click()
        .get('html').should('contain', 'Trezor Bridge');
    });
});
