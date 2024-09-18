// @group_passphrase
// @retry=2

const correctPassphraseAddr =
    'addr1qx3ufjpwcx30ee73a7r29surauze6yt0jvr7c3rnahw0hnppg7qp5xvslcfucsqqayrtjhm4u66x';

describe('Passphrase with cardano', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        // cy.visit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('verify cardano address behind passphrase.', () => {
        const passphrase = 'secret passphrase A';
        // enable cardano in settings
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/ada').click();

        // starting discovery triggers passphrase dialogue
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.discoveryShouldFinish();
        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet(passphrase);

        // turn on view-only on the hidden wallet
        cy.getTestElement('@menu/switch-device').click();
        // TODO: refactor using data-tests
        cy.getTestElement('@switch-device/wallet-on-index/1').then(wallet => {
            cy.wrap(wallet)
                .find('[data-testid="@collapsible-box/icon-collapsed"]')
                .click({ scrollBehavior: 'bottom' });
            cy.wrap(wallet).find('[data-testid$="/enabled"]').should('be.visible').click();
        });

        cy.getTestElement('@switch-device/cancel-button').first().click();

        // restart device
        cy.task('stopEmu');
        cy.getTestElement('@deviceStatus-disconnected');
        cy.task('startEmu');
        cy.getTestElement('@deviceStatus-connected');

        // reveal cardano address
        cy.getTestElement('@account-menu/ada/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-receive').click();
        cy.getTestElement('@wallet/receive/reveal-address-button').click();

        // device after reset asks for passphrase again, enter correct passphrase associated with this account
        cy.getTestElement('@passphrase/input').type(passphrase);
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.wait(501);
        cy.task('pressYes');
        cy.getTestElement('@device-display/paginated-text').should(
            'contain',
            correctPassphraseAddr,
        );
        cy.task('pressYes');
        cy.getTestElement('@metadata/copy-address-button');
        cy.wait(1000);
        cy.getTestElement('@modal/close-button').click();
        cy.getTestElement('@wallet/receive/reveal-address-button');

        // restart device again
        // restart device
        cy.task('stopEmu');
        cy.getTestElement('@deviceStatus-disconnected');
        cy.task('startEmu');
        cy.getTestElement('@deviceStatus-connected');

        // reveal cardano address, now enter wrong passphrase
        cy.getTestElement('@wallet/receive/reveal-address-button').click();
        cy.getTestElement('@passphrase/input').type('wrong passphrase');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.task('pressYes');

        // error should be displayed. definitely no address modal
        cy.getTestElement('@toast/verify-address-error');
    });
});

export {};
