// @group:wallet
// @retry=2

describe('Dashboard with regtest', () => {
    const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');
        cy.task('sendToAddressAndMineBlock', {
            address: ADDRESS_INDEX_1,
            btc_amount: 1,
        });
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Regtest is in dashboard and gets updated when tx is created', () => {
        cy.getTestElement('@dashboard/security-card/backup/button').should('be.disabled');

        // when graph becomes visible, discovery was finished
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');

        cy.enableRegtestAndGetCoins({
            payments: [
                {
                    address: ADDRESS_INDEX_1,
                    amount: 1,
                },
            ],
        });

        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@wallet/coin-balance/value-regtest').should('exist');

        cy.getTestElement('@wallet/coin-balance/value-regtest')
            .text()
            .then(value => {
                // todo: solve regtest resetting. at the moment this value increments with every tets run
                // @ts-expect-error weird typing does not match runtime
                expect(Number.parseFloat(value)).to.be.greaterThan(0);
            });
    });
});

export {};
