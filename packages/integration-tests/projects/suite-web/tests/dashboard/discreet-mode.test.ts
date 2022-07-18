// @group:suite
// @retry=2

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('stopEmu');

        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    afterEach(() => {
        cy.task('stopEmu');
    });

    /*
     * 1. navigate to 'Dashboard' page
     * 2. scroll to Security checks section
     * 3. Enable discreet mode
     * 4. check that status of Discreet mode
     */
    it('Discreet mode checkbox', () => {
        //
        // Test preparation
        //

        const discreetPartialClass = 'HiddenPlaceholder';

        //
        // Test execution
        //

        cy.discoveryShouldFinish();
        cy.getTestElement('@dashboard/security-card/discreet/button').click();

        //
        // Assert
        //
        cy.getTestElement('@wallet/coin-balance/value-btc')
            .parent()
            .parent()
            .invoke('attr', 'class')
            .then(className => {
                expect(className).to.contain(discreetPartialClass);
            });
    });
});
