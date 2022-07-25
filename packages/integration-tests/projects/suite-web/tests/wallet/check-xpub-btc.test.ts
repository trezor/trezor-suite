// @group:wallet
// @retry=2

describe('Check Bitcoin XPUB', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /* Test case
    1. Pass onboarding
    2. Navigate to Accounts/BTC/Account/
    3. Click on @wallets/details/show-xpub-button
    4. Check that @xpub-modal/xpub-field is present
    */
    it('Check Bitcoin XPUB', () => {
        //
        // Test preparation
        //

        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/wallet-index').click();
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
