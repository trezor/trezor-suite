describe('Typography', () => {
    beforeEach(() => {
        cy.viewport(1008, 768);
        cy.loadContent(
            '/iframe.html?selectedKind=Typography&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    [
        'heading_1',
        'heading_2',
        'heading_3',
        'heading_4',
        'heading_5',
        'heading_6',
        'paragraph_small',
        'paragraph_medium',
        'paragraph_large',
        'paragraph_xlarge',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
