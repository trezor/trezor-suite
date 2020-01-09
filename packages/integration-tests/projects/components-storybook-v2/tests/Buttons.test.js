describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'button-primary-small',
        'button-primary-medium',
        'button-primary-large',
        'button-primary-icon',
        'button-primary-icon-right',
        'button-primary-loading',
        'button-primary-full-width',
        'button-primary-disabled',
        'button-secondary-small',
        'button-secondary-medium',
        'button-secondary-large',
        'button-secondary-icon',
        'button-secondary-icon-right',
        'button-secondary-loading',
        'button-secondary-full-width',
        'button-secondary-disabled',
        'button-tertiary-small',
        'button-tertiary-medium',
        'button-tertiary-large',
        'button-tertiary-icon',
        'button-tertiary-icon-right',
        'button-tertiary-loading',
        'button-tertiary-full-width',
        'button-tertiary-disabled',
        'button-danger-small',
        'button-danger-medium',
        'button-danger-large',
        'button-danger-icon',
        'button-danger-icon-right',
        'button-danger-loading',
        'button-danger-full-width',
        'button-danger-disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
            if (testName.match(/icon/)) {
                cy.getTestElement(testName)
                    .find('svg')
                    .each(el => {
                        cy.get(el).should('be.visible');
                    });
            }
            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
