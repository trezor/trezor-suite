/* eslint-disable @typescript-eslint/camelcase */

describe('Passhprase', () => {
    before(() => {
        cy.task('startEmu');
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('setPasshpraseSourceEmu', 2);
        cy.viewport(1024, 768).resetDb();
    });

    it('Enter no passphrase wallet', () => {
        cy.visit('/');
        cy.passThroughInitialRun();
        cy.getTestElement('@modal/passphrase');
        cy.getTestElement('@modal/passhprase/no-passphrase-button').click();
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
