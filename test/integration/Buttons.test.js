describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1366, 600);
    });

    it('Default Button', () => {
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Buttons&selectedStory=Button');
        cy.get('#story-root button')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
