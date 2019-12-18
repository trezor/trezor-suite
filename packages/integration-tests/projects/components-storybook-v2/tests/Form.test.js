describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'switch-off',
        'switch-on',
        'switch-off-small',
        'switch-on-small',
        'checkbox',
        'checkbox-checked',
        'textarea-short',
        'textarea-short-success',
        'textarea-short-warning',
        'textarea-short-error',
        'textarea-short-label',
        'textarea-short-disabled',
        'textarea-default',
        'textarea-success',
        'textarea-warning',
        'textarea-error',
        'textarea-label',
        'textarea-disabled',
        'textarea-block-default',
        'textarea-block-success',
        'textarea-block-warning',
        'textarea-block-error',
        'textarea-block-label',
        'textarea-block-disabled',
        'input-short',
        'input-short-small',
        'input-short-error',
        'input-short-warning',
        'input-short-success',
        'input-short-disabled',
        'input-default',
        'input-default-small',
        'input-default-error',
        'input-default-warning',
        'input-default-success',
        'input-default-disabled',
        'input-label',
        'input-small-label',
        'input-error-label',
        'input-warning-label',
        'input-success-label',
        'input-disabled-label',
        'input-block',
        'input-block-small',
        'input-block-error',
        'input-block-warning',
        'input-block-success',
        'input-block-disabled',
        'input-block-monospace-button',
        'input-block-monospace-hidden',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Form&selectedStory=All&full=0');
            if (testName.match(/error|warning|success/) && !testName.match(/textarea/)) {
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
