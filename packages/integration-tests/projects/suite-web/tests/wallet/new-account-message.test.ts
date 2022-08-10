// @group:wallet
// @retry=2

describe('New accounts', () => {
    beforeEach(() => {
        // Launches Trezor emulator
        cy.task('startEmu', { wipe: true });
        // Initializes Trezor (random seed)
        cy.task('setupEmu', { needs_backup: false, passphrase_protection: true });
        cy.task('startBridge');

        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    const loadHiddenWallet = (passphrase: string) => {
        cy.log('Load hidden wallet (hopefully with no transaction history)');

        cy.getTestElement('@passphrase-type/hidden').click();
        cy.getTestElement('@passphrase/input').type(passphrase);

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphrase);
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');
    };

    const expectedAccountMessage = 'New to Trezor Suite: Bech32 accounts!';

    it(`Goes to accounts and verifies that the "${expectedAccountMessage}" is displayed:`, () => {
        const passphraseToType = 'we need regtest{enter}';

        loadHiddenWallet(passphraseToType);

        cy.log('Go to Accounts page');
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/default-native-account/close');
        cy.contains(expectedAccountMessage);

        cy.log('Click on Got it!');
        cy.getTestElement('@accounts/empty-account/default-native-account/close').click({
            scrollBehavior: 'bottom',
        });
        // Makes sure it is gone.
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/buy');
        cy.getTestElement('@accounts/empty-account/default-native-account/close').should(
            'not.exist',
        );
        cy.contains(expectedAccountMessage).should('not.exist');

        cy.log('Reload page');
        cy.reload();
        loadHiddenWallet(passphraseToType);

        // Makes sure it is still gone.
        cy.getTestElement('@accounts/empty-account/receive');
        cy.getTestElement('@accounts/empty-account/buy');
        cy.getTestElement('@accounts/empty-account/default-native-account/close').should(
            'not.exist',
        );
        cy.contains(expectedAccountMessage).should('not.exist');
    });
});
