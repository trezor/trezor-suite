describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1366, 600);
    });

    it('Input', () => {
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Form&selectedStory=Input');
        cy.get('#story-root input').matchImageSnapshot();
    });
});
