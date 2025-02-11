// @group_wallet
// @retry=2

import { getRandomInt } from '@trezor/utils';

import { onNavBar } from '../../support/pageObjects/topBarObject';

// discovery should end within this time frame
const DISCOVERY_LIMIT = 1000 * 60 * 2;

const coinsToActivate = ['ltc', 'eth', 'etc', 'bch', 'doge', 'ada', 'xrp', 'zec'];
describe('Discovery', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/wallet').click();
    });

    it('go to wallet settings page, activate all coins and see that there is equal number of records on dashboard', () => {
        coinsToActivate.forEach(symbol => {
            cy.getTestElement(`@settings/wallet/network/${symbol}`).click();
        });

        cy.getTestElement('@suite/menu/suite-index').click({ force: true });
        cy.log('all available networks should return something from discovery');

        cy.getTestElement('@dashboard/loading', { timeout: 1000 * 10 });

        // wait randomly between 1000 and 4000 ms
        cy.wait(getRandomInt(1, 40) * 100);
        // trigger reload to simulate interruption. we want to make sure that communication with the device does not
        // end up in some de-synced state. if this test becomes flaky, this reload might be the reason.
        cy.reload();

        // device appears as connected
        cy.getTestElement('@deviceStatus-connected');
        // dashboard is still loading, discovery starts, no error appears
        cy.getTestElement('@dashboard/loading');

        cy.getTestElement('@dashboard/loading', { timeout: DISCOVERY_LIMIT }).should('not.exist');
        ['btc', ...coinsToActivate].forEach(symbol => {
            cy.getTestElement(`@wallet/coin-balance/value-${symbol}`);
        });
    });
});
