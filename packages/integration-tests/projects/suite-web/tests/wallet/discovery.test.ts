import { NETWORKS } from '@wallet-config';

// todo: this test is potentially flaky. I maybe want to introduce two category of tests.

describe.skip('Discovery', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        cy.visit('/settings/wallet');
        cy.passThroughInitialRun();
        cy.getTestElement('@suite/loading').should('not.be.visible');
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
});
