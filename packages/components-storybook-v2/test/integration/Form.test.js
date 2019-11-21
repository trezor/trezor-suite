describe('Form', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'input-short',
        'input-short-small',
        'input-short-error',
        'input-short-success',
        'input-short-disabled',
        'input-default',
        'input-default-small',
        'input-default-error',
        'input-default-success',
        'input-default-disabled',
        'input-block',
        'input-block-small',
        'input-block-error',
        'input-block-success',
        'input-block-disabled',
        'input-label',
        'input-small-label',
        'input-error-label',
        'input-success-label',
        'input-disabled-label',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Form&selectedStory=All&full=0');
            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
