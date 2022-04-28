// @group:suite
// @retry=2

describe('Assets', () => {
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
    });

    /*
     * 1. navigate to the `Dashboard` page
     * 2. check the `Assets` part of the page
     * 3. the modal is rendered correctly and shows 1-n coins
     * 4. click on a coin name (e.g. `Bitcoin`)
     * 5. user is transferred to a bitcoin account
     */
    it('Assets', () => {
        //
        // Test execution && assert
        //
        cy.discoveryShouldFinish();
        cy.contains('Bitcoin').should('be.visible').click();
    });
});
