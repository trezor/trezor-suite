describe('Device settings', () => {
    beforeEach(() => {
        cy.task('startBridge').task('startEmu');
        cy.viewport(1024, 768).resetDb();
    });

    it('change device label', () => {
        cy.visit('/')
            .onboardingShouldLoad()
            .getTestElement('button-use-wallet')
            .click()
            .walletShouldLoad()
            .toggleDeviceMenu()
            .getTestElement('@suite/menu-item/device-settings')
            .click()
            .getTestElement('@suite/device-settings/label-input')
            .clear()
            .type('ledger')
            .getTestElement('@suite/device-settings/label-submit')
            .click()
            .getTestElement('@suite/modal/confirm-action-on-device');
        cy.task('sendDecision', { method: 'applySettings' });
    });
});
