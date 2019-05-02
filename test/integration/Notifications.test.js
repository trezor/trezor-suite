describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.visit(
            'http://localhost:9001/iframe.html?selectedKind=Notifications&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    it('notification_basic_success', () => {
        cy.getTestElement('notification_basic_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_basic_info', () => {
        cy.getTestElement('notification_basic_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_basic_warning', () => {
        cy.getTestElement('notification_basic_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_basic_error', () => {
        cy.getTestElement('notification_basic_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // cancelable
    it('notification_cancelable_success', () => {
        cy.getTestElement('notification_cancelable_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_info', () => {
        cy.getTestElement('notification_cancelable_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_warning', () => {
        cy.getTestElement('notification_cancelable_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_error', () => {
        cy.getTestElement('notification_cancelable_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // cancelable with an action
    it('notification_cancelable_action_success', () => {
        cy.getTestElement('notification_cancelable_action_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_info', () => {
        cy.getTestElement('notification_cancelable_action_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_warning', () => {
        cy.getTestElement('notification_cancelable_action_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_error', () => {
        cy.getTestElement('notification_cancelable_action_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // cancelable with an action in progress
    it('notification_cancelable_action_loading_success', () => {
        cy.getTestElement('notification_cancelable_action_loading_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_loading_info', () => {
        cy.getTestElement('notification_cancelable_action_loading_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_loading_warning', () => {
        cy.getTestElement('notification_cancelable_action_loading_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('notification_cancelable_action_loading_error', () => {
        cy.getTestElement('notification_cancelable_action_loading_error')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
