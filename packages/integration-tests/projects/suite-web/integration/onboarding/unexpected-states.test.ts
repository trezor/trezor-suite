describe('Onboarding unexpected states', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
    });

    it('user selects he is going to use device as a new one and it is already connected, we detect this and notify user about the fact it is not new', () => {
        cy.visit('/');
        cy.onboardingShouldLoad()
            .connectDevice({ firmware: 'valid' })
            .getTestElement('@onboarding/button-path-create')
            .click()
            .getTestElement('@onboarding/button-new-path')
            .click()
            .getTestElement('@onboarding/unexpected-state/use-it-anyway-button');
    });
});
