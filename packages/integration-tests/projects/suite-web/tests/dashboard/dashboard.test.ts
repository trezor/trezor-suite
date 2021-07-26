// @group:suite
// @retry=2

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { version: Cypress.env('emuVersionT2'), wipe: true });
        cy.task('setupEmu', {
            needs_backup: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
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

    it('Trezor News', () => {
        cy.getTestElement(`@dashboard/news/post/0`);
        cy.getTestElement(`@dashboard/news/post/1`);
        cy.getTestElement(`@dashboard/news/post/2`);
        cy.getTestElement(`@dashboard/news/post/3`).should('not.exist');
        cy.getTestElement('@dashboard/news/show-older-news-button').click();
        cy.getTestElement(`@dashboard/news/post/3`);
        cy.getTestElement(`@dashboard/news/post/4`);
        cy.getTestElement(`@dashboard/news/post/5`);
        cy.getTestElement(`@dashboard/news/post/6`).should('not.exist');
        cy.getTestElement('@dashboard/news/show-older-news-button').click();
        cy.getTestElement(`@dashboard/news/post/6`);
        cy.getTestElement(`@dashboard/news/post/7`);
        cy.getTestElement(`@dashboard/news/post/8`);
        cy.getTestElement(`@dashboard/news/post/9`).should('not.exist');
    });

    // QA todo: test for graph
    // QA todo: dashboard appearance for seed with tx history vs seed without tx history
});
