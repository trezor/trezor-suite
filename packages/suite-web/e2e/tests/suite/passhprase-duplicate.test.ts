// @group:passphrase
// @retry=2

describe.skip('Passphrase', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');

        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('passphrase duplicate', () => {
        const passphraseToType = 'taxation is theft{enter}';

        // cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.getTestElement('@dashboard/loading', { timeout: 30000 });
        cy.getTestElement('@dashboard/loading', { timeout: 30000 }).should('not.exist');

        // enter passphrase A for the first time
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type(passphraseToType);

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphraseToType);
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@dashboard/loading').should('not.exist');

        // try to add another wallet with the same passphrase
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();

        cy.task('pressYes');
        cy.task('pressYes');

        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphraseToType);

        // duplicate passphrase modal appears;
        cy.getTestElement('@passphrase-duplicate');

        // QA todo: try different passphrase
        // QA todo: continue to discovered wallet
    });
});
