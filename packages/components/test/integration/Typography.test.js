describe('Typography', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.visit(
            'http://localhost:9001/iframe.html?selectedKind=Typography&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    it('heading_1', () => {
        cy.getTestElement('heading_1')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('heading_2', () => {
        cy.getTestElement('heading_2')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('heading_3', () => {
        cy.getTestElement('heading_3')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('heading_4', () => {
        cy.getTestElement('heading_4')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('heading_5', () => {
        cy.getTestElement('heading_5')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('heading_6', () => {
        cy.getTestElement('heading_6')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('paragraph_small', () => {
        cy.getTestElement('paragraph_small')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('paragraph_medium', () => {
        cy.getTestElement('paragraph_medium')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('paragraph_large', () => {
        cy.getTestElement('paragraph_large')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('paragraph_xlarge', () => {
        cy.getTestElement('paragraph_xlarge')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
