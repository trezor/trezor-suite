describe('Dashboard page', () => {
    beforeEach(() => {
        cy.viewport(1366, 1800);
        cy.visit('/');
    });

    it('navigation', () => {
        cy.getTestElement('Main__page__navigation')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it.skip('content', () => {
        cy.getTestElement('Dashboard__page__content')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // Menu

    it.skip('device header', () => {
        cy.getTestElement('Main__page__device__header')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
