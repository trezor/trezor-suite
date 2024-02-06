// @group:passphrase
// @retry=2

const correctPassphraseAddr =
    'addr1qx3ufjpwcx30ee73a7r29surauze6yt0jvr7c3rnahw0hnppg7qp5xvslcfucsqqayrtjhm4u66x';

describe('Passphrase with cardano', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            mnemonic: 'all all all all all all all all all all all all',
            passphrase_protection: true,
        });
        cy.task('startBridge');

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    it('verify cardano address behind passphrase.', () => {
        // enable cardano in settings
        cy.getTestElement('@settings/wallet/network/ada').click();

        // starting discovery triggers passphrase dialogue
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-wallet-button').click();

        // enter 'secret passphrase A'
        cy.getTestElement('@passphrase/input').type('secret passphrase A');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.task('pressYes');
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/input').type('secret passphrase A');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.task('pressYes');

        // remember device
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@modal/close-button').click();

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
        cy.getTestElement('@passphrase/input').type('secret passphrase A');
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.wait(501);
        cy.task('pressYes');
        cy.getTestElement('@modal/confirm-address/address-field').should(
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
