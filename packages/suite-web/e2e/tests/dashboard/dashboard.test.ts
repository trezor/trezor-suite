// @group_suite
// @retry=2

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    const testCoinmarketInputs = () => {
        cy.getTestElement('@coinmarket/form/select-crypto/input').should('exist');
        cy.getTestElement('@coinmarket/form/fiat-input').should('exist');
        cy.getTestElement('@coinmarket/form/country-select/input').should('exist');
        cy.getTestElement('@coinmarket/form/payment-method-select/input').should('exist');
    };

    it('Assets table buy button', () => {
        cy.getTestElement('@dashboard/assets/table-icon').click();
        cy.getTestElement('@dashboard/assets/table/btc/buy-button').click();

        testCoinmarketInputs();
    });

    it('Assets grid buy button', () => {
        cy.getTestElement('@dashboard/assets/grid-icon').click();
        cy.getTestElement('@dashboard/assets/grid/btc/buy-button').click();

        testCoinmarketInputs();
    });

    // QA todo: test for graph
    // QA todo: dashboard appearance for seed with tx history vs seed without tx history
});

export {};
