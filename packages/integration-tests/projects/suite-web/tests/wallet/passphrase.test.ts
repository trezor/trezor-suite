describe('Passhprase', () => {
    before(() => {
        cy.task('startEmu');
        cy.task('setupEmu', { passphrase_protection: true });
        cy.viewport(1024, 768).resetDb();
    });

    it('?', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@modals/passhprase-source');
        cy.wait(500);
        cy.task('clickEmu');
    });

    // it('enable all networks', () => {
    //     // btc is already checked, so first click is hide;
    //     cy.getTestElement('@wallet/settings/toggle-all-mainnet')
    //         .click()
    //         .click();
    //     cy.getTestElement('@wallet/settings/toggle-all-testnet').click();
    //     cy.getTestElement('@wallet/settings/coin-switch').should(
    //         'have.length',
    //         NETWORKS.filter(n => !n.accountType).length,
    //     );
    // });
});
