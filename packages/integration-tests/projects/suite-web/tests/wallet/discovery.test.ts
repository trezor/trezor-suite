// import { NETWORKS } from '@wallet-config';

// todo: Finish with new design; had to stop with this after rebase.
describe.skip('Discovery', () => {
    before(() => {
        cy.task('startBridge')
            .task('startEmu')
            .task('setupEmu');
        cy.viewport(1024, 768).resetDb();
    });

    // after(() => {
    //     cy.task('stopEmu').task('stopBridge');
    // });

    it('navigate to wallet settings page', () => {
        cy.visit('/')
            .onboardingShouldLoad()
            .getTestElement('button-use-wallet')
            .click()
            .dashboardShouldLoad()
            .toggleDeviceMenu()
            .getTestElement('@suite/menu-item/wallet-settings')
            .click();
    });

    // it('enable all networks', () => {
    //     // btc is already checked, so first click is hide;
    //     cy.getTestElement('@wallet/settings/toggle-all-mainnet')
    //         .click()
    //         .click();
    //     cy.getTestElement('@wallet/settings/toggle-all-testnet').click();
    //     cy.getTestElement('@wallet/settings/coin-switch').should(
    //         'have.length',
    //         NETWORKS.filter(n => !n.accountType).length,
    //     );
    // });
});
