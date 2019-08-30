describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.visit('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
    });

    [
        'button_basic_success',
        'button_basic_info',
        'button_basic_warning',
        'button_basic_error',
        'button_basic_white',
        'button_basic_transparent',
        'button_basic_disabled',
        'button_icon_success',
        'button_icon_info',
        'button_icon_warning',
        'button_icon_error',
        'button_icon_white',
        'button_icon_transparent',
        'button_icon_disabled',
        'button_loading_success',
        'button_loading_info',
        'button_loading_warning',
        'button_loading_error',
        'button_loading_white',
        'button_loading_transparent',
        'button_loading_disabled',
        'button_inverse_success',
        'button_inverse_info',
        'button_inverse_warning',
        'button_inverse_error',
        'button_inverse_white',
        'button_inverse_transparent',
        'button_inverse_disabled',
        'button_inverse_icon_success',
        'button_inverse_icon_info',
        'button_inverse_icon_warning',
        'button_inverse_icon_error',
        'button_inverse_icon_white',
        'button_inverse_icon_transparent',
        'button_inverse_icon_disabled',
    ].forEach(testName => {
        it(`${testName}`, () => {
            if (testName.match(/icon/)) {
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
