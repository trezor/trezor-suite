describe('Tooltip', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
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
