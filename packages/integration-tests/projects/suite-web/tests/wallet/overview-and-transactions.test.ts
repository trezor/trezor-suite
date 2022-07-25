// @group:wallet
// @retry=2

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
     *4. click on the `search bar icon` and paste the address into the field
     */
    it('Check graph span and search a transaction by BTC address', () => {
        //
        // Test execution
        //
        // TODO:refactor into a cycle and add data-test attr for infocard
        cy.contains('span', '1D').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 day').should('be.visible');
        cy.contains('span', '1W').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 week').should('be.visible');
        cy.contains('span', '1M').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 month').should('be.visible');
        cy.contains('span', '1Y').click({ force: true });
        cy.get('[class*=InfoCard]').contains('1 year').should('be.visible');
        cy.contains('span', 'All').click({ force: true });
        cy.get('[class*=InfoCard]').contains('All').should('be.visible');
        cy.getTestElement(
            '@metadata/outputLabel/81d00a47d55b4df0b7a0793533c337493775ceb7f9ae20789325e25051f3374c-0/hover-container',
        )
            .find('span > span')
            .invoke('text')
            .then(notificationText => {
                cy.log(notificationText);
                cy.getTestElement('@wallet/accounts/search-icon').click({ force: true });
                cy.getTestElement('@wallet/accounts/search-icon').type(notificationText);
                cy.wait(500);
                cy.getTestElement('@wallet/accounts/transaction-list')
                    .children()
                    .should('have.length', 2);
            });

        //
        // Assert
        //
    });
});
