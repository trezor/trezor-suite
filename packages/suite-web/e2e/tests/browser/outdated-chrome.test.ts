// @group_other
// @retry=2
// @user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472 Safari/537.36

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Windows 7 with outdated chrome ', () => {
    before(() => {
        cy.viewport(1440, 2560);
        cy.resetDb();
    });

    it('Should just display outdated browser', () => {
        cy.prefixedVisit('/');
        cy.document().its('fonts.status').should('equal', 'loaded');
        cy.get('html').should('contain.text', 'Your browser is outdated');
        cy.get('img')
            .should('be.visible')
            .should('have.length', 2)
            .and($img => {
                // "naturalWidth" and "naturalHeight" are set when the image loads
                expect($img[0].naturalWidth).to.be.greaterThan(0);
                expect($img[1].naturalWidth).to.be.greaterThan(0);
            });

        cy.wait(500); // wait for text rendering to finish before taking a screenshot
        cy.matchImageSnapshot('chrome is supported but outdated');

        cy.get('html').should('contain.text', 'Continue at my own risk');
        cy.getTestElement('@continue-to-suite').click();

        cy.getTestElement('@welcome/title');
    });
});

export {};
