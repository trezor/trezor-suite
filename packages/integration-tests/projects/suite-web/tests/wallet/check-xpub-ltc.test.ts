// @group:suite
// @retry=2

describe('Check Litecoin XPUB', () => {
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
    1. Pass onboarding
    2. Disable BTC coin to speedup discovery process
    3. Enable LTC coin
    4. Navigate to Accounts/LTC/Account/
    5. Click on @wallets/details/show-xpub-button
    6. Check that @xpub-modal/xpub-field is present
    */
    it('Check Litecoin XPUB', () => {
        //
        // Test preparation
        //
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });
        cy.getTestElement('@settings/wallet/network/ltc').click({ force: true });
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/ltc/normal/0/label').click();
        cy.getTestElement('@wallet/menu/wallet-details').click();
        cy.getTestElement('@wallets/details/show-xpub-button').click();
        cy.getTestElement('@xpub-modal/xpub-field').should('exist');

        //
        // Assert
        //
        cy.getTestElement('@xpub-modal/xpub-field').should('be.visible');
    });
});
