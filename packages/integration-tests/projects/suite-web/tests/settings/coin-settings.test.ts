// @group:settings
// @retry=2


describe('Coin Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    it('go to wallet settings page, check BTC, activate all coins, deactivate all coins and check dashboard', () => {
        cy.getTestElement('@settings/wallet/network/btc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/ltc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/test').should('not.be.checked')
        cy.getTestElement('@settings/wallet/network/test').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/testnet').matchImageSnapshot('coin-settings-testnet');

        cy.getTestElement('@settings/wallet/coins-group/mainnet/activate-all').click({ force: true });
      //  cy.getTestElement('@settings/wallet/coins-group/mainnet').matchImageSnapshot('coin-settings-mainnet-enabled-all', { scale: true });

        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({ force: true});
        cy.getTestElement('@settings/wallet/coins-group/testnet').matchImageSnapshot('coin-settings-testnet-enabled-all');


        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/testnet/deactivate-all').click({ force: true });

        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });
        cy.getTestElement('@exception/discovery-empty').matchImageSnapshot('coin-settings-disabled-all-dashboard');
        cy.getTestElement('@exception/discovery-empty/primary-button').click();
        cy.getTestElement('@modal/close-button').click();
        cy.getTestElement('@exception/discovery-empty/secondary-button').click();
    });
});
