// @group:suite
// @retry=2

describe('Go into new accounts', () => {
        beforeEach(() => {
             // Launches Trezor emulator
            cy.task('startEmu', { wipe: true });
            //Initializes Trezor (random seed)
            cy.task('setupEmu', { needs_backup: false });
            cy.task('startBridge');
            cy.viewport(1024, 768).resetDb();
            cy.prefixedVisit('/');
            cy.passThroughInitialRun();
            cy.discoveryShouldFinish();
        });
    

    it('New Accounts', () => {
        //Goes to accounts and verifies that the “New default Accounts natively..” is displayed:
        cy.prefixedVisit('/accounts/');
        cy.getTestElement('@accounts/new/receive');
        cy.getTestElement('@accounts/new/default-native-account');
        cy.contains('New default Accounts natively in Trezor Suite!');
        // cy.getTestElement('@accounts/new/modal').matchImageSnapshot('confirm new native account banner'); - we are not using snapshots for new tests right now
        // Clicks on Got it!
        cy.contains('New default Accounts natively in Trezor Suite!');
        cy.getTestElement('@accounts/new/default-native-account').click({
            scrollBehavior: 'bottom',
        });;
        // Makes sure it is gone.
        cy.getTestElement('@accounts/new/receive');
        cy.getTestElement('@accounts/new/buy');
        cy.getTestElement('@accounts/new/default-native-account').should('not.exist');
        cy.contains('New default Accounts natively in Trezor Suite!').should('not.exist');
        //Reload page.
        cy.reload();
        cy.wait(2000);
        cy.getTestElement('@omboarding-device-acquire').click();
        cy.wait(2000);
        //Makes sure it is still gone.
        cy.getTestElement('@accounts/new/receive');
        cy.getTestElement('@accounts/new/buy');
        cy.getTestElement('@accounts/new/default-native-account').should('not.exist');
        cy.contains('New default Accounts natively in Trezor Suite!').should('not.exist');
        // the last two checks (after clicking on Got it and after reload) could be done in a loop
    });
});
