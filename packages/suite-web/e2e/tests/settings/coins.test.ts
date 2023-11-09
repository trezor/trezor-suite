// @group:settings
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('Coin Settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/settings/coins');
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
            'test',
            'tsep',
            'tgor',
            'thol',
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
