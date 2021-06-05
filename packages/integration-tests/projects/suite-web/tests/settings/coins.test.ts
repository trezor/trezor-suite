// @group:settings
// @retry=2

describe('Coin Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('go to wallet settings page, check BTC, activate all coins, deactivate all coins and check dashboard', () => {
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@suite/menu/settings-coins').click();

        const defaultUnchecked = [
            'ltc',
            'eth',
            'etc',
            'xrp',
            'bch',
            'btg',
            'dash',
            'dgb',
            'doge',
            'nmc',
            'vtc',
            'zec',
            'test',
            'trop',
            'txrp',
        ];

        // only btc is selected by default;
        cy.getTestElement('@settings/wallet/network/btc').should('be.checked');

        // other coins are not selected
        defaultUnchecked.forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).should('not.be.checked');
        });

        // test "Enable all coins" button
        cy.getTestElement('@settings/wallet/network/test').click({ force: true });
        cy.getTestElement('@settings/wallet/coins-group/mainnet/activate-all').click({
            force: true,
        });
        cy.getTestElement('@settings/wallet/coins-group/testnet/activate-all').click({
            force: true,
        });

        // test "Disable all" coins button
        cy.getTestElement('@settings/wallet/coins-group/mainnet/deactivate-all').click({
            force: true,
        });
        cy.getTestElement('@settings/wallet/coins-group/testnet/deactivate-all').click({
            force: true,
        });

        // check dashboard with all coins disabled
        cy.getTestElement('@suite/menu/suite-index').click();

        // discovery empty banner on dashboard
        cy.getTestElement('@exception/discovery-empty').matchImageSnapshot(
            'coin-settings-disabled-all-dashboard',
        );
        cy.getTestElement('@exception/discovery-empty/primary-button').click();
        cy.getTestElement('@modal/close-button').click();
        cy.getTestElement('@exception/discovery-empty/secondary-button').click();

        // just do some clicking on switches and check result
        ['btc', ...defaultUnchecked].forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).should('not.be.checked');
        });

        ['btc', ...defaultUnchecked].forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).click({ force: true });
        });

        ['btc', ...defaultUnchecked].forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).should('be.checked');
        });
    });
});
