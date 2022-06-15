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
        const coin = 'btc';
        const AccsArray = [
            ['normal', 'Bitcoin'],
            ['taproot', 'Bitcoin (Taproot)'],
            ['segwit', 'Bitcoin (Legacy Segwit)'],
            ['legacy', 'Bitcoin (Legacy)'],
        ];
        //
        // Test execution
        //
        cy.getTestElement('@suite/menu/wallet-index', { timeout: 30000 }).click();
        cy.getTestElement('@account-menu/arrow').click({ multiple: true });

        AccsArray.forEach(accountarray =>
            cy
                .get(
                    `[type="${accountarray[0]}"] > [data-test^="@account-menu/${coin}/${accountarray[0]}/"]`,
                )
                .then(specificAccounts => {
                    const numberOfAccounts1 = specificAccounts.length;

                    cy.createAccount(coin, accountarray[1]);

                    cy.get(
                        `[type="${accountarray[0]}"] > [data-test^="@account-menu/${coin}/${accountarray[0]}/"]`,
                    ).then(specificAccounts => {
                        const numberOfAccounts2 = specificAccounts.length;

                        expect(numberOfAccounts2).to.be.equal(numberOfAccounts1 + 1);
                    });
                }),
        );
    });
});
