// @group:settings
// @retry=2

describe('Settings changes persist when device disconnected', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: false });
        cy.task('startBridge');

        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('Settings navigation', () => {
        // Go to send form
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-send').click();

        cy.task('stopEmu');

        // Open settings
        cy.getTestElement('@connect-device-prompt');
        cy.getTestElement('@suite/menu/settings', { timeout: 30000 }).click();
        cy.getTestElement('@settings/menu/device').click();
        cy.getTestElement('@settings/device/disconnected-device-banner').should('exist');

        cy.task('startEmu');

        // Go back to send form
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@account-menu/btc/normal/0').click();
        cy.getTestElement('@wallet/menu/wallet-send').click();
        cy.location('pathname').should('match', /\/accounts\/send$/);
    });
});

export {};
