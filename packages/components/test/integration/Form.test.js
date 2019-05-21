describe('Form', () => {
    beforeEach(() => {
        cy.viewport(800, 768);
        cy.visit(
            '/iframe.html?selectedKind=Form&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    it('input_basic', () => {
        cy.getTestElement('input_basic')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_basic_info', () => {
        cy.getTestElement('input_basic_info')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_basic_success', () => {
        cy.getTestElement('input_basic_success')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_basic_warning', () => {
        cy.getTestElement('input_basic_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('input_basic_error', () => {
        cy.getTestElement('input_basic_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_basic_disabled', () => {
        cy.getTestElement('input_basic_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // with value
    it('input_value', () => {
        cy.getTestElement('input_value')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_value_info', () => {
        cy.getTestElement('input_value_info')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_value_success', () => {
        cy.getTestElement('input_value_success')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_value_warning', () => {
        cy.getTestElement('input_value_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('input_value_error', () => {
        cy.getTestElement('input_value_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_value_disabled', () => {
        cy.getTestElement('input_value_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    //label bottomText
    it('input_label_bottomText', () => {
        cy.getTestElement('input_label_bottomText')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_label_bottomText_info', () => {
        cy.getTestElement('input_label_bottomText_info')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_label_bottomText_success', () => {
        cy.getTestElement('input_label_bottomText_success')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_label_bottomText_warning', () => {
        cy.getTestElement('input_label_bottomText_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_label_bottomText_error', () => {
        cy.getTestElement('input_label_bottomText_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('input_label_bottomText_disabled', () => {
        cy.getTestElement('input_label_bottomText_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // tooltipAction
    it('input_tooltipAction', () => {
        cy.getTestElement('input_tooltipAction')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // pinInput
    it('input_pin', () => {
        cy.getTestElement('input_pin')
            .should('be.visible')
            .matchImageSnapshot();
    });

    //textarea
    it('textarea_basic', () => {
        cy.getTestElement('textarea_basic')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_basic_info', () => {
        cy.getTestElement('textarea_basic_info')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_basic_success', () => {
        cy.getTestElement('textarea_basic_success')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_basic_warning', () => {
        cy.getTestElement('textarea_basic_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('textarea_basic_error', () => {
        cy.getTestElement('textarea_basic_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_basic_disabled', () => {
        cy.getTestElement('textarea_basic_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    //label bottomText
    it('textarea_label_bottomText', () => {
        cy.getTestElement('textarea_label_bottomText')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_label_bottomText_info', () => {
        cy.getTestElement('textarea_label_bottomText_info')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_label_bottomText_success', () => {
        cy.getTestElement('textarea_label_bottomText_success')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_label_bottomText_warning', () => {
        cy.getTestElement('textarea_label_bottomText_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('textarea_label_bottomText_error', () => {
        cy.getTestElement('textarea_label_bottomText_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('textarea_label_bottomText_disabled', () => {
        cy.getTestElement('textarea_label_bottomText_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // Select
    it('select_basic', () => {
        cy.getTestElement('select_basic')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('select_basic_placeholder', () => {
        cy.getTestElement('select_basic_placeholder')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('select_clearable', () => {
        cy.getTestElement('select_clearable')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('select_withoutDropdown', () => {
        cy.getTestElement('select_withoutDropdown')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('select_disabled', () => {
        cy.getTestElement('select_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // checkbox
    it('checkbox_unchecked', () => {
        cy.getTestElement('checkbox_unchecked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('checkbox_checked', () => {
        cy.getTestElement('checkbox_checked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // Switch

    it('switch_basic_unchecked', () => {
        cy.getTestElement('switch_basic_unchecked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_basic_checked', () => {
        cy.getTestElement('switch_basic_checked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_basic_disabled', () => {
        cy.getTestElement('switch_basic_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // small

    it('switch_small_unchecked', () => {
        cy.getTestElement('switch_small_unchecked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_small_checked', () => {
        cy.getTestElement('switch_small_checked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_small_disabled', () => {
        cy.getTestElement('switch_small_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // no icon

    it('switch_noicon_checked', () => {
        cy.getTestElement('switch_noicon_checked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_noicon_disabled', () => {
        cy.getTestElement('switch_noicon_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_noicon_unchecked', () => {
        cy.getTestElement('switch_noicon_unchecked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // no icon small

    it('switch_noicon_small_unchecked', () => {
        cy.getTestElement('switch_noicon_small_unchecked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_noicon_small_checked', () => {
        cy.getTestElement('switch_noicon_small_checked')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('switch_noicon_small_disabled', () => {
        cy.getTestElement('switch_noicon_small_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
