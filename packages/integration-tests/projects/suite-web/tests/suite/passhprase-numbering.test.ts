// @group:suite
// @retry=2

describe('Passphrase', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: '2.3.1' });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('hidden wallet numbering', () => {
        cy.getTestElement('@passphrase-type/standard').click();
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');

        // create standard and two hidden wallets
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type('taxation is theft{enter}');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('taxation is theft');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@dashboard/loading').should('not.exist');
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type('meow{enter}');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/input').type('meow{enter}');
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
        cy.getTestElement('@passphrase/input').type('abc{enter}');
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 10000 }).click();
        cy.getTestElement('@passphrase/input').type('abc{enter}');
        cy.getTestElement('@dashboard/loading').should('not.exist');

        // assert that wallet labels are correct
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').should('contain', 'Hidden wallet #2');
        cy.getTestElement('@switch-device/wallet-on-index/1').should('contain', 'Standard wallet');
        cy.getTestElement('@switch-device/wallet-on-index/2').should('contain', 'Hidden wallet #3');
    });

    // https://github.com/trezor/trezor-suite/issues/3133
    it('when user adds hidden wallet first (no pre-existing standard wallet)', () => {
        cy.getTestElement('@passphrase-type/hidden').click();
        cy.getTestElement('@passphrase/input').type('abc{enter}');
        cy.getTestElement('@modal');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('abc');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@modal').should('not.exist');
        cy.getTestElement('@menu/switch-device').should('contain', 'Hidden wallet #1');
    });
});
