// @group:suite
// @retry=2

describe('Backend disconnected', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');

        cy.mockDiscoveryStart({ coin: 'btc' });
        cy.passThroughInitialRun();
    });

    it('see what happens if suite loses connection to backend', () => {
        cy.getTestElement('@dashboard/loading', { timeout: 10000 });
        cy.getTestElement('@dashboard/loading', { timeout: 10000 }).should('not.exist');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.task('mockDiscoveryStop');
        cy.getTestElement('@notification/backend-disconnected');
        //  QA TODO: possibly snapshot notification?
        cy.getTestElement('@wallet/menu/wallet-receive').click();
        cy.mockDiscoveryStart({ coin: 'btc' });
        cy.getTestElement('@notification/backend-disconnected').should('not.exist');

        // QA TODO: test other cases that are affected when connection to backends goes down
    })
});
