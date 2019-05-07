describe('Buttons', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.visit('http://localhost:9001/iframe.html?selectedKind=Buttons&selectedStory=All&full=0');
    });

    it('button_basic_success', () => {
        cy.getTestElement('button_basic_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_basic_info', () => {
        cy.getTestElement('button_basic_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_basic_warning', () => {
        cy.getTestElement('button_basic_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_basic_error', () => {
        cy.getTestElement('button_basic_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_basic_white', () => {
        cy.getTestElement('button_basic_white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_basic_transparent', () => {
        cy.getTestElement('button_basic_transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_basic_disabled', () => {
        cy.getTestElement('button_basic_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // ICON
    it('button_icon_success', () => {
        cy.getTestElement('button_icon_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_icon_info', () => {
        cy.getTestElement('button_icon_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_icon_warning', () => {
        cy.getTestElement('button_icon_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_icon_error', () => {
        cy.getTestElement('button_icon_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_icon_white', () => {
        cy.getTestElement('button_icon_white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_icon_transparent', () => {
        cy.getTestElement('button_icon_transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_icon_disabled', () => {
        cy.getTestElement('button_icon_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // loading
    it('button_loading_success', () => {
        cy.getTestElement('button_loading_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_loading_info', () => {
        cy.getTestElement('button_loading_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_loading_warning', () => {
        cy.getTestElement('button_loading_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_loading_error', () => {
        cy.getTestElement('button_loading_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_loading_white', () => {
        cy.getTestElement('button_loading_white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_loading_transparent', () => {
        cy.getTestElement('button_loading_transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_loading_disabled', () => {
        cy.getTestElement('button_loading_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // inverse
    it('button_inverse_success', () => {
        cy.getTestElement('button_inverse_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_info', () => {
        cy.getTestElement('button_inverse_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_warning', () => {
        cy.getTestElement('button_inverse_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_error', () => {
        cy.getTestElement('button_inverse_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_white', () => {
        cy.getTestElement('button_inverse_white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_transparent', () => {
        cy.getTestElement('button_inverse_transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_disabled', () => {
        cy.getTestElement('button_inverse_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });

    // inverse_icon
    it('button_inverse_icon_success', () => {
        cy.getTestElement('button_inverse_icon_success')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_icon_info', () => {
        cy.getTestElement('button_inverse_icon_info')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_icon_warning', () => {
        cy.getTestElement('button_inverse_icon_warning')
            .should('be.visible')
            .matchImageSnapshot();
    });
    it('button_inverse_icon_error', () => {
        cy.getTestElement('button_inverse_icon_error')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_icon_white', () => {
        cy.getTestElement('button_inverse_icon_white')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_icon_transparent', () => {
        cy.getTestElement('button_inverse_icon_transparent')
            .should('be.visible')
            .matchImageSnapshot();
    });

    it('button_inverse_icon_disabled', () => {
        cy.getTestElement('button_inverse_icon_disabled')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
