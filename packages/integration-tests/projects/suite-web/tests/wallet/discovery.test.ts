import { NETWORKS } from '@wallet-config';

describe.skip('Discovery', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('stopEmu');
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.prefixedVisit('/settings/wallet');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/loading').should('not.be.visible');
    });

    // todo: this test is potentially flaky. I maybe want to introduce two category of tests.
    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        cy.getTestElement('@settings/wallet/coins-group/mainnet/activate-all').click();
        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({
            force: true,
        });

        cy.getTestElement('@suite/menu/suite-index').click({ force: true });
        cy.log('all available networks should return something from discovery');
        cy.getTestElement('@dashboard/asset-card', { timeout: 120 * 1000 }).should(
            'have.length',
            NETWORKS.filter(n => !n.accountType).length,
        );
    });

    // todo: I ll need to do some fixes to tests, but in next PR
    it(`
        1. connect model 2
        2. go to settings/coins
        3. disable all networks, enable XRP
        4. go back to wallet
        5. connect model 1
    `, () => {
        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click();
        cy.getTestElement('@settings/wallet/coins-group/testnet/deactivate-all').click({
            force: true,
        });
        cy.getTestElement('@settings/wallet/network/xrp').click({ force: true });
        cy.task('stopEmu');
        cy.task('startEmu', '1.8.3');
        cy.task('setupEmu');
        cy.getTestElement('@settings/wallet/network/xrp').should('not.exist');
    });
});
