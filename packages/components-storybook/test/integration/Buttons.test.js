describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        // basic
        'button_basic',
        'button_basic_transparent',
        'button_basic_disabled',
        'button_basic_icon',
        'button_basic_icon_transparent',
        'button_basic_icon_disabled',
        'button_basic_loading',
        'button_basic_loading_transparent',
        'button_basic_loading_disabled',
        'button_full_width',
        'button_full_width_transparent',
        'button_full_width_disabled',
        'button_full_width_right',
        'button_full_width_right_transparent',
        'button_full_width_right_disabled',
        'button_full_width_left',
        'button_full_width_left_transparent',
        'button_full_width_left_disabled',
        'button_full_width_icon',
        'button_full_width_icon_transparent',
        'button_full_width_icon_disabled',
        'button_full_width_icon_right',
        'button_full_width_icon_right_transparent',
        'button_full_width_icon_right_disabled',
        'button_full_width_icon_left',
        'button_full_width_icon_left_transparent',
        'button_full_width_icon_left_disabled',
        'button_full_width_loading',
        'button_full_width_loading_transparent',
        'button_full_width_loading_disabled',
        'button_full_width_loading_right',
        'button_full_width_loading_right_transparent',
        'button_full_width_loading_right_disabled',
        'button_full_width_loading_left',
        'button_full_width_loading_left_transparent',
        'button_full_width_loading_left_disabled',
        // inverse
        'button_inverse',
        'button_inverse_icon',
        'button_inverse_loading',
        'button_inverse_full_width',
        'button_inverse_icon_full_width',
        'button_inverse_loading_full_width',
        'button_inverse_full_width_right',
        'button_inverse_icon_full_width_right',
        'button_inverse_loading_full_width_right',
        'button_inverse_full_width_left',
        'button_inverse_icon_full_width_left',
        'button_inverse_loading_full_width_left',
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

    it(`Button pin`, () => {
        cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
        cy.getTestElement('button_pin')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
