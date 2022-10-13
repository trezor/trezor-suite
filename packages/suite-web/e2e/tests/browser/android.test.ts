// @group:browser
// @retry=2
// @user-agent=Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Android with non-chrome browser', () => {
    before(() => {
        cy.viewport('samsung-note9');
        cy.resetDb();
    });

    it('Should display unsupported browsers page', () => {
        cy.prefixedVisit('/');
        cy.document().its('fonts.status').should('equal', 'loaded');
        cy.get('html').should('contain.text', 'Your browser is not supported');
        cy.get('img')
            .should('be.visible')
            .should('have.length', 1)
            .and($img => {
                // "naturalWidth" and "naturalHeight" are set when the image loads
                expect($img[0].naturalWidth).to.be.greaterThan(0);
            });
        cy.wait(500); // wait for text rendering to finish before taking a screenshot
        cy.matchImageSnapshot('android browser is not supported');

        cy.get('html').should('contain.text', 'Continue at my own risk');
        cy.getTestElement('@continue-to-suite').click();

        cy.getTestElement('@welcome/title');
    });
});
