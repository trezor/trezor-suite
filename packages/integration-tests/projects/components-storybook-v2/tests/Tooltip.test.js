describe.skip('Tooltip', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    ['tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right'].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Tooltip&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .should('be.visible')
                .trigger('mouseenter')
                .matchImageSnapshot();
        });
    });
});
