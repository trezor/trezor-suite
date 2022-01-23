describe('Typography', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'heading-1',
        'heading-2',
        'paragraph-default',
        'paragraph-small',
        'paragraph-tiny',
        'paragraph-bold',
        'paragraph-small-bold',
        'paragraph-link',
        'paragraph-link-small',
        'paragraph-link-tiny',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Typography&selectedStory=All&full=0');
            cy.wait(666);
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
