// @group:wallet
// @retry=2

const ADDRESS_INDEX_1 = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

describe('Dashboard with regtest', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
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
                expect(Number.parseFloat(value)).to.be.greaterThan(0);
            });
    });
});
