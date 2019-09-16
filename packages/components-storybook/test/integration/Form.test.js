describe('Form', () => {
    beforeEach(() => {
        cy.viewport(784, 768);
        cy.loadContent(
            '/iframe.html?selectedKind=Form&selectedStory=All&full=0&addons=1&stories=1&panelRight=1&addonPanel=storybooks%2Fstorybook-addon-knobs'
        );
    });

    [
        'input_basic',
        'input_basic_info',
        'input_basic_success',
        'input_basic_warning',
        'input_basic_error',
        'input_basic_disabled',
        'input_value',
        'input_value_info',
        'input_value_success',
        'input_value_warning',
        'input_value_error',
        'input_basic_disabled',
        'input_value_disabled',
        'input_label_bottomText',
        'input_label_bottomText_info',
        'input_label_bottomText_success',
        'input_label_bottomText_warning',
        'input_label_bottomText_error',
        'input_label_bottomText_disabled',
        'input_tooltipAction',
        'input_pin',
        'textarea_basic',
        'textarea_basic_info',
        'textarea_basic_success',
        'textarea_basic_warning',
        'textarea_basic_error',
        'textarea_basic_disabled',
        'textarea_label_bottomText',
        'textarea_label_bottomText_info',
        'textarea_label_bottomText_success',
        'textarea_label_bottomText_warning',
        'textarea_label_bottomText_error',
        'textarea_label_bottomText_disabled',
        'select_basic',
        'select_basic_placeholder',
        'select_clearable',
        'select_withoutDropdown',
        'select_disabled',
        'checkbox_unchecked',
        'checkbox_checked',
        'switch_basic_unchecked',
        'switch_basic_checked',
        'switch_basic_disabled',
        'switch_small_unchecked',
        'switch_small_checked',
        'switch_small_disabled',
        'switch_noicon_checked',
        'switch_noicon_disabled',
        'switch_noicon_unchecked',
        'switch_noicon_small_unchecked',
        'switch_noicon_small_checked',
        'switch_noicon_small_disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            if (
                testName.match(/info|success|warning|error|checkbox_checked/) &&
                !testName.match(/textarea/)
            ) {
                cy.getTestElement(testName)
                    .find('.loading')
                    .each(el => {
                        cy.get(el).should('not.exist');
                    });

                cy.getTestElement(testName)
                    .find('svg')
                    .should('be.visible');
            }

            cy.getTestElement(testName)
                .should('be.visible')
                .matchImageSnapshot();
        });
    });
});
