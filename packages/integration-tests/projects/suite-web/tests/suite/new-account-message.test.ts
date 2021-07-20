// @group:suite
// @retry=2

describe('New accounts', () => {
        beforeEach(() => {
             // Launches Trezor emulator
            cy.task('startEmu', { wipe: true });
            // Initializes Trezor (random seed)
            cy.task('setupEmu', { needs_backup: false });
            cy.task('startBridge');
            cy.viewport(1024, 768).resetDb();
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();
            cy.discoveryShouldFinish();
        });
    

    it('Goes to accounts and verifies that the "New default Accounts natively.." is displayed:', () => {
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/default-native-account/close');
        cy.contains('New default Accounts natively in Trezor Suite!');
        // Clicks on Got it!
        cy.getTestElement('@accounts/empty-account/default-native-account/close').click({
            scrollBehavior: 'bottom',
        });
        // Makes sure it is gone.
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/buy');
        cy.getTestElement('@accounts/empty-account/default-native-account/close').should('not.exist');
        cy.contains('New default Accounts natively in Trezor Suite!').should('not.exist');
        // Reload page.
        cy.reload();
        // Makes sure it is still gone.
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/buy');
        cy.getTestElement('@accounts/empty-account/default-native-account/close').should('not.exist');
        cy.contains('New default Accounts natively in Trezor Suite!').should('not.exist');
    });
});
