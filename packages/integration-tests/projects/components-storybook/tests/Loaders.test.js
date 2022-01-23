describe('Loaders', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'loader-default',
        'loader-small-text',
        'loader-transparent-route',
        'loader-white-text',
        'loader-white-text-transparent',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Loaders&selectedStory=All&full=0');
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
