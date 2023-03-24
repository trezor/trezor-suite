// @group:wallet

describe('suite', () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: ADDRESS_INDEX_1,
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
