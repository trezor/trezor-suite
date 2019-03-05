describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1366, 1800);
    });

    it('Button', () => {
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Buttons&selectedStory=Button');
        cy.get('#story-root > button').matchImageSnapshot();
    });
});
