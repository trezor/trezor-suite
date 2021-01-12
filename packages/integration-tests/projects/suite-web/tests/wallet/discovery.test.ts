// @group:suite
// @retry=2

// QA TODO: idea behind this file was to create a test that checks if all backends are running.
// Supposed to be a true "end to end" test really testing also that blockbooks are alive.
// It would be nice to figure out how to split all cypress tests into 2 categories where
// one would be more "unit tests like" using mocks extensively that would be run on every commit
// while the other one would more end to end like that would run maybe only on develop branch and possibly
// in scheduled jobs

describe.skip('Discovery', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click({
            force: true,
        });
        cy.getTestElement('@settings/wallet/network/test').click({ force: true });

        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({
            force: true,
        });

        cy.getTestElement('@suite/menu/suite-index').click({ force: true });
        cy.log('all available networks should return something from discovery');

        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });
        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 60 }).should('not.exist');
    });
});
