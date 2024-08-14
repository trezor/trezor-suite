// @group_other
// @retry=2
// @user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Safari on MacOS 14 ', () => {
    before(() => {
        cy.viewport(1440, 2560);
        cy.resetDb();
    });

    it('Should display unsupported browsers page', () => {
        cy.prefixedVisit('/');
        cy.document().its('fonts.status').should('equal', 'loaded');
        cy.get('html').should('contain.text', 'Your browser is not supported');
        cy.get('img')
            .should('be.visible')
            .should('have.length', 2)
            .and($img => {
                // "naturalWidth" and "naturalHeight" are set when the image loads
                expect($img[0].naturalWidth).to.be.greaterThan(0);
                expect($img[1].naturalWidth).to.be.greaterThan(0);
            });
        cy.wait(500); // wait for text rendering to finish before taking a screenshot
        cy.matchImageSnapshot('browser is not supported at all');

        cy.get('html').should('contain.text', 'Continue at my own risk');
        cy.getTestElement('@continue-to-suite').click();

        cy.getTestElement('@welcome/title');
    });
});

export {};
