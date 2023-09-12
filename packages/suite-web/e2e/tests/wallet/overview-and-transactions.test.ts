// @group_wallet
// @retry=2

import { onAccountsPage } from '../../support/pageObjects/accountsObject';

describe('Overview and transactions check', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1980, 1440).resetDb();
        cy.prefixedVisit('/accounts');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });
    /* Test case
     *1. navigate to the `Accounts/overview`
     *2. click through all range views (`1D`, `1W`, `1M`, `1Y`, any `Range`)
     *3. copy `btc` address of the last transaction
     *4. click on the `search bar icon` and paste the address into the fi0eld
     *5. go to a certain accounts page and verify you are on that page
     */
    it('Check graph span and search a transaction by BTC address', () => {
        //
        // Test execution
        //
        // TODO:refactor into a cycle and add data-test attr for infocard

        onAccountsPage.cycleThroughGraphspan();
        onAccountsPage.searchLatestTxAddress();

        //
        // Assert
        //

        //
        // Test preparation
        //

        onAccountsPage.scrolltoBottomAccountspage();

        //
        // Test execution and assert
        //

        onAccountsPage.accountsPaginationCheck();
    });
});

export {};
