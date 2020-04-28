describe('Modal', () => {
    it('modal', () => {
        cy.viewport(1024, 500);
        cy.loadContent('iframe.html?id=modals--default');
        cy.getTestElement('modal').should('be.visible').matchImageSnapshot();
    });
});
