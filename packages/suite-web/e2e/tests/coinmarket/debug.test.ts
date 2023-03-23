// @group:coinmarket

describe('suite', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: 'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
                    amount: 1,
                },
            ],
        });

        // navigate to buy
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();
    });

    it('debug test, should pass', () => {
        cy.wrap(true).should('be.true');
    });
});
