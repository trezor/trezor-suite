// @group_passphrase
// @retry=2

describe('Passphrase', () => {
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

    it('passphrase duplicate', () => {
        const passphraseToType = 'taxation is theft';

        // enter passphrase A for the first time
        cy.getTestElement('@menu/switch-device').click();
        cy.addHiddenWallet(passphraseToType);

        // try to add another wallet with the same passphrase
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();

        cy.task('pressYes');
        cy.wait(501);
        cy.task('pressYes');
        cy.wait(501);

        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type(passphraseToType);
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.task('pressYes');
        cy.wait(501);

        // duplicate passphrase modal appears;
        cy.getTestElement('@passphrase-duplicate-header');

        // QA todo: try different passphrase
        // QA todo: continue to discovered wallet
    });
});

export {};
