// @group_wallet
// @retry=2

import { onNavBar } from '../../support/pageObjects/topBarObject';

describe('Look up a BTC account', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'cancel solid bulb sample fury scrap whale ranch raven razor sight skin',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/wallet').click();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /** Test case
     * 1. navigate to the `Accounts`
     * 2. in the left side bar search panel, type in `bitcoin`
     */
    it('Search for bitcoin in accounts', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/ltc').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/search-input').type('bitcoin');
        //
        // Assert
        //
        cy.getTestElement('@account-menu/ltc/normal/0').should('not.exist');
    });
});

export {};
