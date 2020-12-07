// @group:suite
// @user-agent=Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1

// note that running tests in /browser folder will not work in 'debug local setup'

describe('Ubuntu with outdated firefox ', () => {
    before(() => {
        cy.task('stopEmu');
        cy.viewport(1024, 768);
        cy.resetDb();
    });

    it('Should just display outdated browser', () => {
        cy.prefixedVisit('/');
        cy.get('html').should('contain.text', 'Your browser is outdated');
        cy.screenshot();
    });
})