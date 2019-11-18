describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'button-primary-small',
        'button-primary-medium',
        'button-primary-large',
        'button-primary-disabled',
        'button-secondary-small',
        'button-secondary-medium',
        'button-secondary-large',
        'button-secondary-disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
