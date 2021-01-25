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
        cy.getTestElement('@settings/wallet/network/eth').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/etc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/xrp').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/bch').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/btg').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/dash').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/dgb').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/doge').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/nmc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/vtc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/zec').should('not.be.checked');

        cy.getTestElement('@settings/wallet/network/test').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/trop').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/txrp').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/test').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/testnet') //.matchImageSnapshot('coin-settings-testnet');

        cy.getTestElement('@settings/wallet/coins-group/mainnet/activate-all').click({ force: true });
      //  cy.getTestElement('@settings/wallet/coins-group/mainnet').matchImageSnapshot('coin-settings-mainnet-enabled-all', { scale: true });

        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({ force: true});
        cy.getTestElement('@settings/wallet/coins-group/testnet') //.matchImageSnapshot('coin-settings-testnet-enabled-all');


        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/testnet/deactivate-all').click({ force: true });

        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });
        cy.getTestElement('@exception/discovery-empty') //.matchImageSnapshot('coin-settings-disabled-all-dashboard');
        cy.getTestElement('@exception/discovery-empty/primary-button').click();
        cy.getTestElement('@modal/close-button').click();
        cy.getTestElement('@exception/discovery-empty/secondary-button').click();
        cy.getTestElement('@settings/wallet/network/btc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/ltc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/eth').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/etc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/xrp').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/bch').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/btg').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/dash').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/dgb').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/doge').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/nmc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/vtc').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/zec').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/test').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/trop').should('not.be.checked');
        cy.getTestElement('@settings/wallet/network/txrp').should('not.be.checked');

        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/ltc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/eth').click({ force: true });
        cy.getTestElement('@settings/wallet/network/etc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/xrp').click({ force: true });
        cy.getTestElement('@settings/wallet/network/bch').click({ force: true });
        cy.getTestElement('@settings/wallet/network/btg').click({ force: true });
        cy.getTestElement('@settings/wallet/network/dash').click({ force: true });
        cy.getTestElement('@settings/wallet/network/dgb').click({ force: true });
        cy.getTestElement('@settings/wallet/network/doge').click({ force: true });
        cy.getTestElement('@settings/wallet/network/nmc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/vtc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/zec').click({ force: true });
        cy.getTestElement('@settings/wallet/network/test').click({ force: true });
        cy.getTestElement('@settings/wallet/network/trop').click({ force: true });
        cy.getTestElement('@settings/wallet/network/txrp').click({ force: true });

        cy.getTestElement('@settings/wallet/network/btc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/ltc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/eth').should('be.checked');
        cy.getTestElement('@settings/wallet/network/etc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/xrp').should('be.checked');
        cy.getTestElement('@settings/wallet/network/bch').should('be.checked');
        cy.getTestElement('@settings/wallet/network/btg').should('be.checked');
        cy.getTestElement('@settings/wallet/network/dash').should('be.checked');
        cy.getTestElement('@settings/wallet/network/dgb').should('be.checked');
        cy.getTestElement('@settings/wallet/network/doge').should('be.checked');
        cy.getTestElement('@settings/wallet/network/nmc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/vtc').should('be.checked');
        cy.getTestElement('@settings/wallet/network/zec').should('be.checked');
        cy.getTestElement('@settings/wallet/network/test').should('be.checked');
        cy.getTestElement('@settings/wallet/network/trop').should('be.checked');
        cy.getTestElement('@settings/wallet/network/txrp').should('be.checked');
    });
});
