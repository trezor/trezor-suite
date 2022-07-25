// @group:wallet
// @retry=2

describe('Check Vertcoin XPUB', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case
     * 1. Pass onboarding
     * 2. Disable BTC coin to speedup discovery process
     * 3. Enable VTC coin
     * 4. Navigate to Accounts/VTC/Account/
     * 5. Click on @wallets/details/show-xpub-button
     * 6. Check that @xpub-modal/xpub-field is present
     * 7. Check xpub prefix in xpub text
     */
    it('Check Vertcoin XPUB', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/vtc').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/vtc/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-details').click();
        cy.getTestElement('@wallets/details/show-xpub-button').click();
        cy.getTestElement('@xpub-modal/xpub-field').should('exist');

        //
        // Assert
        //
        cy.getTestElement('@xpub-modal/xpub-field')
            .should('be.visible')
            .invoke('text')
            .should('contain', 'zpub');
    });
});
