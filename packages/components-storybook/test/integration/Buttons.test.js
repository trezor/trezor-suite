describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
    });

    [
        'button_basic',
        'button_basic_transparent',
        'button_basic_disabled',
        'button_basic_icon',
        'button_basic_icon_transparent',
        'button_basic_icon_disabled',
        'button_basic_loading',
        'button_basic_loading_transparent',
        'button_basic_loading_disabled',

        'button_basic_full_width',
        'button_basic_transparent_full_width',
        'button_basic_disabled_full_width',
        'button_basic_full_width_icon',
        'button_basic_icon_transparent_full_width',
        'button_basic_icon_disabled_full_width',
        'button_basic_full_width_loading',
        'button_basic_loading_transparent_full_width',
        'button_basic_loading_disabled_full_width',

        'button_basic_full_width_right',
        'button_basic_transparent_full_width_right',
        'button_basic_disabled_full_width_right',
        'button_basic_icon_full_width_right',
        'button_basic_icon_transparent_full_width_right',
        'button_basic_icon_disabled_full_width_right',
        'button_basic_loading_full_width_right',
        'button_basic_loading_transparent_full_width_right',
        'button_basic_loading_disabled_full_width_right',

        'button_basic_full_width_left',
        'button_basic_transparent_full_width_left',
        'button_basic_disabled_full_width_left',
        'button_basic_icon_full_width_left',
        'button_basic_icon_transparent_full_width_left',
        'button_basic_icon_disabled_full_width_left',
        'button_basic_loading_full_width_left',
        'button_basic_loading_transparent_full_width_left',
        'button_basic_loading_disabled_full_width_left',
    ].forEach(testName => {
        it(`${testName}`, () => {
            cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
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

    [
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
            cy.loadContent('/iframe.html?selectedKind=Buttons&selectedStory=Inverse&full=0');
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
