describe('TrezorLogo', () => {
    beforeEach(() => {
        cy.viewport(1024, 768);
        cy.visit('/iframe.html?selectedKind=Other&selectedStory=TrezorLogo&full=0');
    });

    it(`TrezorLogo`, () => {
        cy.getTestElement('trezor_logo')
            .should('be.visible')
            .matchImageSnapshot();
    });
});
