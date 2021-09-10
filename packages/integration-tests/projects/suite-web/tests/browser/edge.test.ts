// @group:suite
// @retry=2
// @user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Windows 10 with edge browser ', () => {
    before(() => {
        cy.viewport(1024, 768);
        cy.resetDb();
    });

    it('Should display unsupported browsers page', () => {
        cy.prefixedVisit('/');
        cy.document().its('fonts.status').should('equal', 'loaded');
        cy.get('html').should('contain.text', 'Your browser is not supported');
        cy.get('img')
            .should('be.visible')
            .and($img => {
                // "naturalWidth" and "naturalHeight" are set when the image loads
                expect($img[0].naturalWidth).to.be.greaterThan(0);
                expect($img[1].naturalWidth).to.be.greaterThan(0);
            });
        cy.matchImageSnapshot('browser is not supported at all');
    });
});
