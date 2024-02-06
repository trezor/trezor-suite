// @group:wallet
// @retry=2

describe('Look up a BTC account', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'cancel solid bulb sample fury scrap whale ranch raven razor sight skin',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /** Test case
     * 1. navigate to the `Accounts`
     * 2. in the left side bar search panel, type in `bitcoin`
     */
    it('Search for bitcoin in accounts', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/ltc').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/search-input').type('bitcoin');
        //
        // Assert
        //
        cy.getTestElement('@account-menu/ltc/normal/0').should('not.exist');
    });
});

export {};
