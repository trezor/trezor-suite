// @group_suite
// @retry=2

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Assets table buy button', () => {
        cy.getTestElement('@dashboard/assets/table-icon').click();
        cy.getTestElement('@dashboard/assets/table/btc/buy-button').click();
        cy.getTestElement('@coinmarket/buy/crypto-currency-select/input').should(
            'contain.text',
            'BTC',
        );
    });

    it('Assets grid buy button', () => {
        cy.getTestElement('@dashboard/assets/grid-icon').click();
        cy.getTestElement('@dashboard/assets/grid/btc/buy-button').click();
        cy.getTestElement('@coinmarket/buy/crypto-currency-select/input').should(
            'contain.text',
            'BTC',
        );
    });

    // QA todo: test for graph
    // QA todo: dashboard appearance for seed with tx history vs seed without tx history
});

export {};
