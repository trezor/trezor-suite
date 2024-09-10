// @group_passphrase
// @retry=2

const DEFAULT_STANDARD_WALLET_LABEL = 'Standard wallet';
const DEFAULT_HIDDEN_WALLET_LABEL = 'Hidden wallet #';

// TODO: refactor this test using this tc:
// add a passphrase wallet,
// turn off passphrase (need to be done outside of suite, I see that in device settings this option has disappeared once it is turned on).
// try to access account of a passphrase wallet and see that this is well handled
describe.skip('Suite switch wallet modal', () => {
    beforeEach(() => {
        cy.viewport(1440, 2560).resetDb();
        cy.task('startBridge');
    });

    it('passphrase_protection: false', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: false });

        cy.prefixedVisit('/');

        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
        cy.wait(501);
        cy.prefixedVisit('/settings');

        cy.getTestElement('@menu/switch-device').click();

        // device does not have state yet, there is only one button to discovery the first wallet
        cy.getTestElement('@switch-device/add-wallet-button').click();
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');
        cy.getTestElement('@menu/switch-device').should('contain', DEFAULT_STANDARD_WALLET_LABEL);

        cy.getTestElement('@menu/switch-device').click();

        cy.getTestElement('@switch-device/wallet-on-index/0').should(
            'contain',
            DEFAULT_STANDARD_WALLET_LABEL,
        );
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();

        cy.getTestElement('@prompts/confirm-on-device');
        cy.task('pressYes');

        const passphaseToType = 'taxation is theft';
        cy.getTestElement('@passphrase/input').type(passphaseToType);
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphaseToType);
        cy.getTestElement('@passphrase/confirm-checkbox', { timeout: 20000 }).click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@modal').should('not.exist');

        cy.getTestElement('@menu/switch-device').should(
            'contain',
            `${DEFAULT_HIDDEN_WALLET_LABEL}1`,
        );
        cy.getTestElement('@menu/switch-device').click();
    });
});

export {};
