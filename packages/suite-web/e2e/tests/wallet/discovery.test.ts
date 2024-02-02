// @group:wallet
// @retry=2

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

const coinsToActivate = [
    'ltc',
    'eth',
    'etc',
    'dash',
    'btg',
    'bch',
    'doge',
    'vtc',
    'ada',
    'xrp',
    'dgb',
    'zec',
    'nmc',
];
describe('Discovery', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        coinsToActivate.forEach(symbol => {
            cy.getTestElement(`@settings/wallet/network/${symbol}`).click();
        });

        cy.getTestElement('@suite/menu/suite-index').click({ force: true });
        cy.log('all available networks should return something from discovery');

        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });
        cy.getTestElement('@dashboard/loading', { timeout: DISCOVERY_LIMIT }).should('not.exist');
        ['btc', ...coinsToActivate].forEach(symbol => {
            cy.getTestElement(`@wallet/coin-balance/value-${symbol}`);
        });
    });
});

export {};
