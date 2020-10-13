// @group:suite
// @retry=2

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

// todo: discovery does not run to end, is it only in tests?
describe.skip('Discovery', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        cy.getTestElement('@settings/wallet/coins-group/mainnet/activate-all').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({
            force: true,
        });

        cy.getTestElement('@suite/menu/suite-index').click({ force: true });
        cy.log('all available networks should return something from discovery');

        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });
        cy.getTestElement('@dashboard/loading', { timeout: DISCOVERY_LIMIT }).should(
            'not.exist',
        );
    });
});
