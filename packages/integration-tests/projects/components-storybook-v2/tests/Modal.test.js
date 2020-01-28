describe('Modal', () => {
    it('modal', () => {
        cy.viewport(1024, 500);
        cy.loadContent('iframe.html?id=modals--default');
        cy.getTestElement('modal')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('modal-with-cancel', () => {
        cy.viewport(1024, 500);
        cy.loadContent('/iframe.html?id=modals--padding-with-cancel');
        cy.getTestElement('modal-with-cancel')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal-with-cancel')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
