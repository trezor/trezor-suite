// @group_settings
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';
import { onNavBar } from '../../support/pageObjects/topBarObject';

let requests: Requests;

describe('Coin Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1440, 2560).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    it('go to wallet settings page, check BTC, activate all coins, deactivate all coins, set custom backend', () => {
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
            // 'sol', FIXME: disabled till available in trezor-user-env
            'test',
            'tsep',
            'thol',
            'txrp',
            'tada',
            // 'dsol', FIXME: disabled till available in trezor-user-env
        ];

        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/wallet').click();

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

        // // this helps with unstable click to btc
        cy.contains('span', 'Got it!').should('be.visible').click();
        cy.wait(500);
        // disable Bitcoin
        cy.getTestElement('@settings/wallet/network/btc').click();
        cy.getTestElement('@settings/wallet/network/btc').should(
            'have.attr',
            'data-active',
            'false',
        );
        // check dashboard with all coins disabled
        cy.getTestElement('@suite/menu/suite-index').click();

        // check that there is no assets grid
        cy.get('[class^="AssetsView__Grid"] > [class^="Card"]').should('not.exist');

        onNavBar.openSettings();
        cy.getTestElement('@settings/menu/wallet').click();
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

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsCoins>>(
            requests,
            EventType.SettingsCoins,
        ).then(settingsCoinsEvent => {
            expect(settingsCoinsEvent.symbol).to.be.oneOf(['btc', ...defaultUnchecked]);
            expect(settingsCoinsEvent.value).to.be.oneOf(['true', 'false']);
        });

        // custom eth backend
        cy.getTestElement('@settings/wallet/network/eth/advance').click();
        cy.getTestElement('@settings/advance/select-type/input').click();
        cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
        // sometimes select stays open after click, no idea why, experimenting with wait
        cy.wait(100);
        cy.getTestElement('@settings/advance/url').type('https://eth.marek.pl/');
        cy.getTestElement('@settings/advance/button/save').click();

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsCoinsBackend>>(
            requests,
            EventType.SettingsCoinsBackend,
        ).then(settingsCoinsBackendEvent => {
            expect(settingsCoinsBackendEvent.symbol).to.equal('eth');
            expect(settingsCoinsBackendEvent.type).to.equal('blockbook');
            expect(settingsCoinsBackendEvent.totalRegular).to.equal('1');
            expect(settingsCoinsBackendEvent.totalOnion).to.equal('0');
        });
    });
});

export {};
