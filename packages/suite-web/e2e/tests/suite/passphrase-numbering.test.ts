// @group:passphrase
// @retry=2

describe('Passphrase numbering', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');
        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('hidden wallet numbering', () => {
        const passphraseOne = 'taxation is theft{enter}';
        const passphraseTwo = 'meow{enter}';
        const passphraseThree = 'abc{enter}';

        cy.getTestElement('@passphrase-type/standard').click();
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');

        // create standard and two hidden wallets
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type(passphraseOne);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('taxation is theft');
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type(passphraseTwo);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/input').type(passphraseTwo);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');

        // assert that wallet labels are correct
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').should('contain', 'Standard wallet');
        cy.getTestElement('@switch-device/wallet-on-index/1').should('contain', 'Hidden wallet #1');
        cy.getTestElement('@switch-device/wallet-on-index/2').should('contain', 'Hidden wallet #2');

        // eject standard and the first hidden wallet
        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();

        // add standard and another hidden wallet
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type(passphraseThree);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/input').type(passphraseThree);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');

        // assert that wallet labels are correct
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').should('contain', 'Hidden wallet #2');
        cy.getTestElement('@switch-device/wallet-on-index/1').should('contain', 'Standard wallet');
        cy.getTestElement('@switch-device/wallet-on-index/2').should('contain', 'Hidden wallet #3');
    });

    // https://github.com/trezor/trezor-suite/issues/3133
    it('when user adds hidden wallet first (no pre-existing standard wallet)', () => {
        const passphrase = 'abc{enter}';

        cy.getTestElement('@passphrase-type/hidden').click();
        cy.getTestElement('@passphrase/input').type(passphrase);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphrase);
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal').should('not.exist');
        cy.getTestElement('@menu/switch-device').should('contain', 'Hidden wallet #1');
    });
});

export {};
