// @group:suite
// @retry=2

const abcAddr = 'bc1qpyfvfvm52zx7gek86ajj5pkkne3h385ada8r2y';
const defAddr = 'bc1qek0hazgrelpuce8anp72ur4kpgel74ype3pw52';

describe('Passphrase', () => {
    beforeEach(() => {
        // note that versions before 2.3.1 don't have passphrase caching, this means that returning
        // back to passphrase that was used before in the session would require to type the passphrase again
        cy.task('startEmu', { wipe: true, version: '2.3.1' });
        cy.task('setupEmu');

        // eslint-disable-next-line @typescript-eslint/naming-convention
        cy.task('applySettings', { passphrase_always_on_device: false });
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('just test passphrase input', () => {
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.task('pressYes');

        // select whole text and delete it
        cy.getTestElement('@passphrase/input').type('123456');
        cy.getTestElement('@passphrase/input').type('{selectall}{backspace}');
        cy.getTestElement('@passphrase/input').should('have.value', '');

        // leftarrow sets caret to correct position
        cy.getTestElement('@passphrase/input').type('abcdef{leftarrow}{leftarrow}12');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', 'abcd12ef');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('{leftarrow}{leftarrow}{backspace}{backspace}');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', 'ab12ef');

        // toggle hidden/visible keeps caret position
        cy.getTestElement('@passphrase/input').clear();
        cy.getTestElement('@passphrase/input').type('123{leftarrow}');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', '12abc3');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').type('{rightarrow}xyz');
        cy.getTestElement('@passphrase/show-toggle').click();
        cy.getTestElement('@passphrase/input').should('have.value', '12abc3xyz');

        // when selectionStart===0 (looking at you nullish coalescing)
        cy.getTestElement('@passphrase/input')
            .clear()
            .type('123{leftarrow}{leftarrow}{leftarrow}abc');
        cy.getTestElement('@passphrase/input').should('have.value', 'abc123');
        cy.getTestElement('@passphrase/input')
            .clear()
            .type('123{leftarrow}{leftarrow}{leftarrow}{backspace}{del}');
        cy.getTestElement('@passphrase/input').should('have.value', '23');

        // todo: make sure that setting caret position via mouse click works as well could not make it, click does not move caret using cypress?
        // cy.getTestElement('@passphrase/input').clear().type('123456');
        // cy.getTestElement('@passphrase/input').trigger('click', 40, 25);

        // todo: select part of test + copy/paste
    });

    it('add 1st hidden wallet (abc) -> fail to confirm passphrase -> try again from notification, succeed -> check 1st address -> switch to 2nd hidden wallet (def) -> check 1st address -> go back to 1st hidden wallet -> check confirm passphrase appears. ', () => {
        cy.log('passphrase abc for the first time');
        // add 1st hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.task('pressYes');
        // first input
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        // confirm
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/input').type('cba');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@toast/auth-confirm-error/close').click();
        // retry
        cy.getTestElement('@passphrase-mismatch/retry-button').click();
        // confirm again
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/input').type('abc');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        // go to wallet
        cy.getTestElement('@suite/menu/wallet-index').click();
        // go to receive
        cy.getTestElement('@wallet/menu/wallet-receive').click();
        // click reveal address
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@modal/confirm-address/address-field').should('contain', abcAddr);
        cy.task('pressYes');
        // close modal
        cy.getTestElement('@modal/close-button').click();

        cy.log('passphrase def');
        // add 2nd hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.getTestElement('@passphrase/input').type('def');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        // confirm
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/input').type('def');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.be.visible');
        // click reveal address
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        cy.getTestElement('@modal/confirm-address/address-field').should('contain', defAddr);
        cy.task('pressYes');
        // close modal
        cy.getTestElement('@modal/close-button').click();

        cy.log('passphrase abc again. now it is cached in device');
        // now go back to the 1st wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-instance/1').click();
        // reveal 0 address again
        // no address should be in table yet
        cy.getTestElement('@wallet/receive/used-address/0').should('not.exist');
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        // should display confirm passphrase modal
        cy.getTestElement('@suite/loading').should('not.be.visible');
        cy.getTestElement('@modal/confirm-address/address-field').should('contain', abcAddr);
        cy.task('pressYes');
    });

    // todo: passphrase duplicate test
    it.skip('passphrase duplicate', () => {});
});
