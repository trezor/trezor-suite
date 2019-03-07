describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1366, 1800);
        cy.visit(
            'http://localhost:9001/iframe.html?selectedKind=Buttons&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    it('Default Button', () => {
        cy.getTestElement('Button__default')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('Default Button - White', () => {
        cy.getTestElement('Button__white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('Default Button - Transparent', () => {
        cy.getTestElement('Button__transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('Default Button - Disabled', () => {
        cy.getTestElement('Button__disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
