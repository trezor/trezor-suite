// @group:wallet
// @retry=2

describe('Coinmarket', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });

        cy.task('setupEmu', {});
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Basic trade walkthrough', () => {
        cy.discoveryShouldFinish();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-coinmarket-buy').click();

        // basic walkthrough buy tab

        // todo: change screenshot to matchImageSnapshot once we are sure
        cy.getTestElement('@app').screenshot('exchange', {
            blackout: ['[data-test="@app/navigation/aside"]'],
        });
        cy.getTestElement('@coinmarket/buy/fiat-input').type('100000');
        cy.getTestElement('@coinmarket/buy/compare-button').click();
        cy.getTestElement('@coinmarket/buy/offers-list');
        cy.screenshot('coinmarket-buy-offers');
        cy.getTestElement('@coinmarket/back').click();

        // todo: sell
        // todo: exchange
        // todo: spend
    });
});

export {};
