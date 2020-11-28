// @group:suite
// @retry=2

const DEFAULT_STANDARD_WALLET_LABEL = 'Standard wallet';
const DEFAULT_HIDDEN_WALLET_LABEL = 'Hidden wallet #';

describe('Suite switch wallet modal', () => {
    beforeEach(() => {
        cy.viewport(1024, 768).resetDb();
        cy.task('stopEmu');
    });

    it('passphrase_protection: false', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: false });
        cy.prefixedVisit('/settings');

        cy.passThroughInitialRun();

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

        cy.getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/input').type('taxation is theft{enter}');
        cy.getTestElement('@suite/loading');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('taxation is theft{enter}');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.be.visible');

        cy.getTestElement('@menu/switch-device').should(
            'contain',
            `${DEFAULT_HIDDEN_WALLET_LABEL}1`,
        );
        cy.getTestElement('@menu/switch-device').click();
    });
});
