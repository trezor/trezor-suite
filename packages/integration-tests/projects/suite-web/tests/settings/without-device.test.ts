// @group:settings
// @retry=2

describe('Settings changes persist when device disconnected', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { passphrase_protection: false });
        cy.task('startBridge');

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Settings navigation', () => {
        // Go to send form
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@wallet/menu/wallet-send').click();

        cy.task('stopEmu');
        cy.getTestElement('@toast/auth-failed/close').click();

        // Open settings
        cy.getTestElement('@suite/menu/settings', { timeout: 30000 }).click();
        cy.getTestElement('@suite/menu/settings-device').click();
        cy.getTestElement('@settings/device/disconnected-device-banner').should('exist');

        cy.task('startEmu');

        // Close settings when device connected, should be on send form again
        cy.getTestElement('@settings/menu/close').click();
        cy.location('pathname').should('match', /\/accounts\/send$/);
    });

    it('Settings persistence', () => {
        cy.task('stopEmu');
        cy.getTestElement('@toast/auth-failed/close').click();

        // Open settings, enable ETH
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-coins').click();
        cy.getTestElement('@settings/wallet/network/eth').click({ force: true });

        cy.task('startEmu');

        // Verify settings persistence
        cy.getTestElement('@settings/menu/close').click();
        cy.getTestElement('@suite/menu/wallet-index').click();
        cy.getTestElement('@account-menu/eth/normal/0').should('be.visible');
    });
});
