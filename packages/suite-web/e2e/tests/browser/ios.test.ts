// @group:other
// @retry=2
// @user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1

// note that running tests in /browser folder will not work in 'debug local setup'

describe('iPhone with chrome browser ', () => {
    before(() => {
        cy.viewport('iphone-6');
        cy.resetDb();
    });

    it('There is no way to connect trezor to iPhone at the moment', () => {
        cy.prefixedVisit('/');
        cy.getTestElement('@browser-detect')
            .get('h1')
            .should('contain', 'Suite doesn’t work on iOS yet');
        cy.wait(500); // wait for text rendering to finish before taking a screenshot
        cy.matchImageSnapshot('no webusb support');

        cy.get('html').should('not.contain.text', 'Continue at my own risk');
    });
});

export {};
