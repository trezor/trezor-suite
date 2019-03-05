describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1366, 1800);
    });

    it('Input', () => {
        cy.viewport(460, 250);
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Form&selectedStory=Input');
        cy.get('#story-root input').matchImageSnapshot();
    });
});
