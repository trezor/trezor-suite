// @group:other
// @retry=2
// @user-agent=Mozilla/5.0 (Android 13; Mobile; LG-M255; rv:114.0) Gecko/114.0 Firefox/114.0

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

export {};
