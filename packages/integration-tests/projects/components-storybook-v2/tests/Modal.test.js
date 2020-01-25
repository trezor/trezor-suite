describe.skip('Modal', () => {
    it('modal-small', () => {
        cy.viewport(1024, 500);
        cy.loadContent('/iframe.html?selectedKind=Modals&selectedStory=Small&full=0');
        cy.getTestElement('modal-small')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal-small')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('modal-medium', () => {
        cy.viewport(1024, 500);
        cy.loadContent('/iframe.html?selectedKind=Modals&selectedStory=Medium&full=0');
        cy.getTestElement('modal-medium')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal-medium')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('modal-large', () => {
        cy.viewport(1024, 500);
        cy.loadContent('/iframe.html?selectedKind=Modals&selectedStory=Large&full=0');
        cy.getTestElement('modal-large')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal-large')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('modal-responsive', () => {
        cy.viewport(760, 500);
        cy.loadContent('/iframe.html?selectedKind=Modals&selectedStory=Large&full=0');
        cy.getTestElement('modal-large')
            .find('svg')
            .each(el => {
                cy.get(el).should('be.visible');
            });
        cy.getTestElement('modal-large')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
