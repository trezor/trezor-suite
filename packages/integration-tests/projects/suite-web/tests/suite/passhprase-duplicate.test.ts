// @group:suite
// @retry=2

describe('Passphrase', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: true });

        // eslint-disable-next-line @typescript-eslint/naming-convention
        cy.task('applySettings', { passphrase_always_on_device: false });
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('passphrase duplicate', () => {
        // cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@passphrase-type/standard').click();
        cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 });
        cy.getTestElement('@wallet/discovery-progress-bar', { timeout: 30000 }).should('not.exist');

        // enter passphrase A for the first time
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input').type('taxation is theft{enter}');
        cy.getTestElement('@suite/loading');
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('taxation is theft{enter}');
        cy.getTestElement('@passphrase/confirm-checkbox').click();
        cy.getTestElement('@passphrase/hidden/submit-button').click();
        cy.getTestElement('@suite/loading').should('not.be.visible');

        // try to add another wallet with the same passphrase
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/add-hidden-wallet-button').click();
        cy.getTestElement('@passphrase/input', { timeout: 10000 }).type('taxation is theft{enter}');
        cy.getTestElement('@suite/loading');

        // duplicate passphrase modal appears;
        cy.getTestElement('@passphrase-duplicate');

        // QA todo: try different passphrase
        // QA todo: continue to discovered wallet
    });
});
