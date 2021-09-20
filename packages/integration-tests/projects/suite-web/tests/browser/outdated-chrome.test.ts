// @group:suite
// @retry=2
// @user-agent=Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Windows 7 with outdated chrome ', () => {
    before(() => {
        cy.viewport(1024, 768);
        cy.resetDb();
    });

    it('Should just display outdated browser', () => {
        cy.prefixedVisit('/');
        cy.document().its('fonts.status').should('equal', 'loaded');
        cy.get('html').should('contain.text', 'Your browser is outdated');
        cy.matchImageSnapshot('chrome is supported but outdated');
    });
});
