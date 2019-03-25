describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    it('Input', () => {
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Form&selectedStory=Input');
        cy.get('#story-root input').matchImageSnapshot();
    });
});
