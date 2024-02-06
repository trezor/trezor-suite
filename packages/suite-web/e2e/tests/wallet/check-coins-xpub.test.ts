// @group:wallet
// @retry=2

import { NetworkSymbol } from '@suite-common/wallet-config';
import { onAccountsPage } from '../../support/pageObjects/accountsObject';

describe('Check coins XPUB', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/accounts');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    const coins: NetworkSymbol[] = ['btc', 'ltc', 'vtc', 'ada'];

    /**
     * 1. Start in Accounts section
     * 2. If not Bitcoin test activate coin
     * 3. Apply coin filter
     * 4. Navigate to First accounts Wallet detail
     * 5. Click Show public key
     * 6. Check that XPUB is present
     * 7. Check XPUB prefix matches coin type
     */
    coins.forEach(coin => {
        it(`Check ${coin} XPUB`, () => {
            if (coin !== 'btc') {
                onAccountsPage.activatNewCoin(coin);
                cy.getTestElement(`@account-menu/filter/${coin}`).click();
            }

            cy.getTestElement('@wallet/menu/wallet-details').click();
            cy.getTestElement('@wallets/details/show-xpub-button').click();
            cy.getTestElement('@xpub-modal/xpub-field').should('exist');
            if (coin !== 'ada') {
                cy.getTestElement('@xpub-modal/xpub-field')
                    .should('be.visible')
                    .invoke('text')
                    .should('contain', 'zpub');
            }
        });
    });
});

export {};
