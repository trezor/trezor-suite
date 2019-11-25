describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'button-primary-small',
        'button-primary-medium',
        'button-primary-large',
        'button-primary-icon',
        'button-primary-loading',
        'button-primary-disabled',
        'button-secondary-small',
        'button-secondary-medium',
        'button-secondary-large',
        'button-secondary-icon',
        'button-secondary-loading',
        'button-secondary-disabled',
        'button-danger-small',
        'button-danger-medium',
        'button-danger-large',
        'button-danger-icon',
        'button-danger-loading',
        'button-danger-disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            if (testName.match(/icon/)) {
                cy.getTestElement(testName)
                    .find('svg')
                    .each(el => {
                        cy.get(el).should('be.visible');
                    });
            }
            cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
