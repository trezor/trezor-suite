describe('Tooltip', () => {
    beforeEach(() => {
        cy.viewport(1200, 850);
    });

    ['tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right'].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?path=/story/tooltip--all');
            cy.getTestElement(testName)
                .should('be.visible')
                .trigger('mouseenter')
                .matchImageSnapshot();
        });
    });
});
