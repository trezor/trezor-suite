const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

describe('Passphrase', () => {
    beforeEach(() => {
        cy.task('startEmu');
        cy.task('setupEmu');
        cy.task('setPasshpraseSourceEmu', 'host');
        cy.viewport(1024, 768).resetDb();
        cy.visit('/');
        cy.passThroughInitialRun();
    });

    it('add 1st hidden wallet (abc) -> fail to confirm passphrase -> try again from notification, succeed -> check 1st address -> switch to 2nd hidden wallet (def) -> check 1st address -> go back to 1st hidden wallet -> check confirm passphrase appears. ', () => {
        cy.log('passphrase abc');
        // add 1st hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.task('sendDecision');
        // first input
        cy.getTestElement('@passhphrase/input').type('abc');
        cy.getTestElement('@passphrase/submit-button').click();
        // confirm
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passhphrase/input').type('cba');
        cy.getTestElement('@passphrase/submit-button').click();
        // retry
        cy.getTestElement('@passphrase-missmatch/retry-button').click();
        // confirm again
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passhphrase/input').type('abc');
        cy.getTestElement('@passphrase/submit-button').click();
        // go to wallet
        cy.getTestElement('@suite/menu/wallet-index').click();
        // go to receive
        cy.getTestElement('@wallet/menu/wallet-receive').click();
        // click reveal address
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@no-backup/take-risk-button').click();
        cy.getTestElement('@address-modal/address-field').should('contain', abcAddr);
        cy.task('sendDecision');

        cy.log('passphrase def');
        // add 2nd hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.getTestElement('@passhphrase/input').type('def');
        cy.getTestElement('@passphrase/submit-button').click();
        // confirm
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passhphrase/input').type('def');
        cy.getTestElement('@passphrase/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.be.visible');
        // click reveal address
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        cy.getTestElement('@no-backup/take-risk-button').click();
        cy.getTestElement('@address-modal/address-field').should('contain', defAddr);
        cy.task('sendDecision');

        cy.log('passphrase abc again');
        // now go back to the 1st wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-instance/1').click();
        // reveal 0 address again
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        cy.getTestElement('@no-backup/take-risk-button').click();
        // should display confirm passphrase modal
        cy.getTestElement('@passhphrase/input').type('abc');
        cy.getTestElement('@passphrase/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.be.visible');
        cy.getTestElement('@address-modal/address-field').should('contain', abcAddr);
        cy.task('sendDecision');
    });

    // todo: passphrase duplicate test
    it.skip('passphrase duplicate', () => {});
});
