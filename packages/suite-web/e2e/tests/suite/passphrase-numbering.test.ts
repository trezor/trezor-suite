// @group_passphrase
// @retry=2

describe('Passphrase numbering', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');
        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('hidden wallet numbering', () => {
        const passphraseOne = 'taxation is theft{enter}';
        const passphraseTwo = 'meow{enter}';
        const passphraseThree = 'abc{enter}';

        // first hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet(passphraseOne);
        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet(passphraseTwo);

        // assert that wallet labels are correct
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').should('contain', 'Standard wallet');
        cy.getTestElement('@switch-device/wallet-on-index/1').should(
            'contain',
            'Passphrase wallet #1',
        );
        cy.getTestElement('@switch-device/wallet-on-index/2').should(
            'contain',
            'Passphrase wallet #2',
        );

        // eject standard and the first hidden wallet
        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.getTestElement('@switch-device/eject').should('be.visible').click();

        cy.getTestElement('@switch-device/wallet-on-index/0/eject-button').click();
        cy.getTestElement('@switch-device/eject').should('be.visible').click();

        // add standard and another hidden wallet
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.discoveryShouldFinish();

        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet(passphraseThree);

        // assert that wallet labels are correct
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0').should(
            'contain',
            'Passphrase wallet #2',
        );
        cy.getTestElement('@switch-device/wallet-on-index/1').should('contain', 'Standard wallet');
        cy.getTestElement('@switch-device/wallet-on-index/2').should(
            'contain',
            'Passphrase wallet #3',
        );
    });

    // TODO: add coverage for different wallet names displaying in the device switcher component
});
