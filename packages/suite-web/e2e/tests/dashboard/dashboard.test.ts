// @group:suite
// @retry=2

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.interceptInvityApi();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Security cards', () => {
        // disabled until discovery ends
        cy.getTestElement('@dashboard/security-card/backup/button').should('be.disabled');
        cy.getTestElement('@dashboard/security-card/pin/button').should('be.disabled');
        cy.getTestElement('@dashboard/security-card/hidden-wallet/button').should('be.disabled');
        // when graph becomes visible, discovery was finished
        cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');

        // backup card opens backup modal on primary button click
        cy.getTestElement('@dashboard/security-card/backup/button').click();
        cy.getTestElement('@backup');
        cy.getTestElement('@backup/close-button').click();

        // pin card initiates set pin call on primary button click
        cy.getTestElement('@dashboard/security-card/pin/button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressNo');

        // hidden button card should initiate call to update device features (turn passphrase_protection on)
        cy.getTestElement('@dashboard/security-card/hidden-wallet/button').click();
        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');
        cy.getTestElement('@suite/modal/confirm-action-on-device').should('not.exist');
        // once passphrase enabled, clicking button in the same security card adds hidden wallet
        cy.getTestElement('@dashboard/security-card/create-hidden-wallet/button').click();
        cy.getTestElement('@passphrase/input');

        // QA todo: discreet @dashboard/security-card/toggle-discreet/button
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
