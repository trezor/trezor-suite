// @group:coinmarket

describe('Coinmarket DCA US', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        // cy.task('setupEmu', { needs_backup: false });
        // cy.task('startBridge');

        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        // Navigate to DCA Savings
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/add-account').click();
        cy.getTestElement('@settings/wallet/network/btc').click();
        cy.getTestElement('@add-account').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
        cy.getTestElement('@coinmarket/menu/wallet-coinmarket-savings').click();
    });

    /**
     * Test Case Scenario
     * 1. Navigates to Accounts/BTC account without DCA setup/Trade/Save Bitcoin
     * 2. Changes the country to the United States of America and sets up for Weekly, 80USD
     * 3. Presses "Confirm" and go through the consent modal
     * 4. Checks whether the redirect to Invity.io took place
     */

    it('DCA US Flow Initiation', () => {
        cy.getTestElement('@coinmarket/savings/drop-down-country/input').click();
        cy.contains('United States of America').click();
        cy.getTestElement('@select-bar/Weekly').click();
        cy.getTestElement('@select-bar/80').click();
        // cy.getTestElement('@coinmarket/savings/summary').should('eq', '$1,440.00'); // Doesn't work. Why?
        cy.getTestElement('@coinmarket/savings/confirm-setup').click();
        cy.getTestElement('@modal').should('be.visible');
        cy.getTestElement('@coinmarket/savings/offers/buy-terms-agree-checkbox').click();
        cy.getTestElement('@coinmarket/savings/offers/buy-terms-confirm-button').click();
        cy.url().should('include', 'invity.io');
    });
});

export {};
