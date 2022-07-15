// @group:suite
// @retry=2

describe('Add-account-types', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
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

    /**
     * Test case
     * 1. Go to Accounts
     * 2. Unpack all account types
     * 3. Get the number of accounts
     * 4. Create new account for each account type
     * 5. Get the number of accounts again
     * 6. Verify that the current number is equeal to previous number + 1
     */
    it('Add-account-types-BTC', () => {
        //
        // Test preparation
        //
        //
        // Test execution
        //
        //
        // Assert
        //
    });
});
