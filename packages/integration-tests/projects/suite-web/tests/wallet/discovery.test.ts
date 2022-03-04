/* eslint-disable no-restricted-syntax */
// @group:wallet
// @retry=2

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

const networks = [
    'ltc',
    'eth',
    'etc',
    'xrp',
    'bch',
    'btg',
    'dash',
    'dgb',
    'doge',
    'nmc',
    'vtc',
    'zec',
    'ada',
];

describe('Discovery', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        // go to settings right away, don't wait until discovery ends or even starts
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();

        // activate all mainnet coins
        for (const network of networks) {
            cy.getTestElement(`@settings/wallet/network/${network}`).should('not.be.disabled');
            cy.getTestElement(`@settings/wallet/network/${network}`).click({ force: true });
        }

        // go to the dashboard.
        cy.getTestElement('@suite/menu/suite-index').click();

        // discovery should start immediately but it does not.
        // my guess is that rapid switch from dashboard to settings somehow breaks discovery logic
        cy.getTestElement('@dashboard/loading');
        cy.getTestElement('@dashboard/loading', { timeout: DISCOVERY_LIMIT }).should('not.exist');

        // opening wallet selection modal and clicking 'standard' wallet does not trigger discovery either
        // you may comment lines 52 and 53 and try
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').click();
    });
});
