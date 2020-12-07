// @group:suite
// @user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1

// note that running tests in /browser folder will not work in 'debug local setup'

describe('iPhone with chrome browser ', () => {
    before(() => {
        cy.viewport('iphone-6');
        cy.resetDb();
    });

    it('There is no way to connect trezor to iPhone at the moment', () => {
        cy.prefixedVisit('/');
        cy.get('body').should('contain.text', 'No WebUSB support');
        cy.screenshot();
    });
})