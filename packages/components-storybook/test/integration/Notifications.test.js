describe('Notifications', () => {
    beforeEach(() => {
        cy.viewport(1008, 768);
        cy.loadContent(
            '/iframe.html?selectedKind=Notifications&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    [
        'notification_basic_success',
        'notification_basic_info',
        'notification_basic_warning',
        'notification_basic_error',
        'notification_cancelable_success',
        'notification_cancelable_info',
        'notification_cancelable_warning',
        'notification_cancelable_error',
        'notification_cancelable_action_success',
        'notification_cancelable_action_info',
        'notification_cancelable_action_warning',
        'notification_cancelable_action_error',
        'notification_cancelable_action_loading_success',
        'notification_cancelable_action_loading_info',
        'notification_cancelable_action_loading_warning',
        'notification_cancelable_action_loading_error',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.getTestElement(testName)
                .find('.loading')
                .each(el => {
                    cy.get(el).should('not.exist');
                });

            cy.getTestElement(testName)
                .find('svg')
                .each(el => {
                    cy.get(el).should('be.visible');
                });

            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
