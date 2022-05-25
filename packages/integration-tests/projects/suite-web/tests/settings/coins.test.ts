// @group:settings
// @retry=2

describe('Coin Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
        cy.passThroughInitialRun();
    });

    it('go to wallet settings page, check BTC, activate all coins, deactivate all coins and check dashboard', () => {
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
            'ada',
            'test',
            'trop',
            'txrp',
            'tada',
        ];

        // only btc is selected by default;
        cy.getTestElement('@settings/wallet/network/btc').should(
            'have.attr',
            'data-active',
            'true',
        );

        // other coins are not selected
        defaultUnchecked.forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).should(
                'have.attr',
                'data-active',
                'false',
            );
        });

        // disable Bitcoin
        cy.getTestElement('@settings/wallet/network/btc').click({ force: true });

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
            cy.getTestElement(`@settings/wallet/network/${network}`).should(
                'have.attr',
                'data-active',
                'false',
            );
        });

        ['btc', ...defaultUnchecked].forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).click({ force: true });
        });

        ['btc', ...defaultUnchecked].forEach(network => {
            cy.getTestElement(`@settings/wallet/network/${network}`).should(
                'have.attr',
                'data-active',
                'true',
            );
        });
    });
});
