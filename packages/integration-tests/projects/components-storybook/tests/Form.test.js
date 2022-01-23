describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        // input
        'input-default',
        'input-default-small',
        'input-default-error',
        'input-default-warning',
        'input-default-success',
        'input-default-disabled',
        'input-block-monospace-button',
        'input-block-monospace-hidden',
        'input-label',
        'input-small-label',
        'input-error-label',
        'input-warning-label',
        'input-success-label',
        'input-disabled-label',
        // textarea
        'textarea-default',
        'textarea-success',
        'textarea-warning',
        'textarea-error',
        'textarea-label',
        'textarea-disabled',
        // switch
        'switch-off',
        'switch-off-disabled',
        'switch-on',
        'switch-on-disabled',
        'switch-off-small',
        'switch-off-small-disabled',
        'switch-on-small',
        'switch-on-small-disabled',
        // checkbox
        'checkbox',
        'checkbox-checked',
        // select
        'select',
        'select-selected',
        'select-small',
        'select-disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Form&selectedStory=All&full=0');
            if (testName.match(/checked|monospace/) && !testName.match(/textarea/)) {
                cy.getTestElement(testName)
                    .find('svg')
                    .each(el => {
                        cy.get(el).should('be.visible');
                    });
            }
            cy.getTestElement(testName).should('be.visible').matchImageSnapshot();
        });
    });
});
