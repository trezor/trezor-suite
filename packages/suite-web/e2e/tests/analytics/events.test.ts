// @group:suite
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

const windowWidth = 1080;
const windowHeight = 1440;

describe('Analytics Events', () => {
    beforeEach(() => {
        cy.viewport(windowWidth, windowHeight).resetDb();
        requests = [];
    });

    it('reports transport-type, suite-ready and device-connect/device-disconnect events when analytics is initialized and enabled', () => {
        cy.prefixedVisit('/');

        // go to settings and enable analytics (makes analytics enabled and initialized)
        cy.getTestElement('@suite/menu/settings').click();
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@settings/menu/close').click();

        cy.task('startEmu', { wipe: true, version: '2.6.0' });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
            passphrase_protection: true,
        });

        cy.task('startBridge');

        // reload to activate bridge and start testing app with enabled analytics
        cy.reload();
        cy.interceptDataTrezorIo(requests);

        // suite-ready is logged 1st, just check that it is reported when app is initialized and enabled
        // device-connect is logged 2nd
        // transport-type is logged 3th

        // wait until loaded
        cy.getTestElement('@onboarding/exit-app-button');
        cy.wrap(requests).should('have.length', 3);
        cy.wrap(requests).its(0).should('have.property', 'c_type', EventType.SuiteReady);
        cy.wrap(requests).its(1).should('have.property', 'c_type', EventType.DeviceConnect);
        cy.wrap(requests).its(2).should('have.property', 'c_type', EventType.TransportType);

        // device-connect
        cy.findAnalyticsEventByType<ExtractByEventType<EventType.DeviceConnect>>(
            requests,
            EventType.DeviceConnect,
        ).then(deviceConnectEvent => {
            expect(deviceConnectEvent.mode).to.equal('normal'); // not in BL
            expect(deviceConnectEvent.firmware).to.equal('2.6.0'); // 2.6.0 is hardcoded in startEmu to always match
            expect(deviceConnectEvent.firmwareRevision).to.equal(
                // good to check because of phishing
                '88e1f8c7a5c7615723664c64b0a25adc0c409dee', // https://github.com/trezor/trezor-firmware/releases/tag/core%2Fv2.6.0
            );
            expect(deviceConnectEvent.bootloaderHash).to.equal('');
            expect(deviceConnectEvent.backup_type).to.equal('Bip39');
            expect(deviceConnectEvent.pin_protection).to.equal('false');
            expect(deviceConnectEvent.passphrase_protection).to.equal('true'); // set in startEmu
            expect(deviceConnectEvent.totalInstances).to.equal('1');
            expect(deviceConnectEvent.isBitcoinOnly).to.equal('false');
            expect(deviceConnectEvent.totalDevices).to.equal('1');
            expect(deviceConnectEvent.language).to.equal('en-US');
            expect(deviceConnectEvent.model).to.equal('T2T1');
        });

        // transport-type
        cy.findAnalyticsEventByType<ExtractByEventType<EventType.TransportType>>(
            requests,
            EventType.TransportType,
        ).then(transportTypeEvent => {
            expect(transportTypeEvent.type).to.equal('BridgeTransport');
            expect(parseInt(transportTypeEvent.version, 10)).to.not.equal(NaN);
        });

        // device-disconnect is logged 4th
        cy.task('stopEmu');
        cy.wrap(requests).should('have.length', 4);
        cy.wrap(requests).its(3).should('have.property', 'c_type', EventType.DeviceDisconnect);
    });

    it('reports suite-ready after enabling analytics on app initial run', () => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', {
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
        cy.task('startBridge');

        cy.interceptDataTrezorIo(requests);

        cy.prefixedVisit('/');

        // change few settings to see if it is different from default values in suite-ready
        cy.getTestElement('@suite/menu/settings').click();

        // change language
        cy.getTestElement('@settings/language-select/input').click();
        cy.getTestElement('@settings/language-select/option/cs').click();

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click();
        cy.getTestElement('@settings/fiat-select/option/czk').click();

        // change BTC units
        cy.getTestElement('@settings/btc-units-select/input').click();
        cy.getTestElement('@settings/btc-units-select/option/Satoshis').click(); // sat

        // change dark mode
        cy.getTestElement('@theme/color-scheme-select/input').click();
        cy.getTestElement('@theme/color-scheme-select/option/dark').click();

        // disable btc, enable ethereum and goerli
        cy.getTestElement('@settings/menu/wallet').click();
        cy.getTestElement('@settings/wallet/network/btc').click();
        cy.getTestElement('@settings/wallet/network/eth').click();
        cy.getTestElement('@settings/wallet/network/tgor').click();

        // custom eth backend
        cy.getTestElement('@settings/wallet/network/eth/advance').click();
        cy.getTestElement('@settings/advance/select-type/input').click();
        cy.getTestElement('@settings/advance/select-type/option/blockbook').click();
        cy.getTestElement('@settings/advance/url').type('https://eth.marek.pl/');
        cy.getTestElement('@settings/advance/button/save').click();

        cy.getTestElement('@settings/menu/close').click();

        // nothing should be reported until analytics is initialized and enabled
        cy.wrap(requests).should('have.length', 0);

        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@onboarding/exit-app-button');

        // settings/analytics and suite-ready should be reported now
        // settings/analytics is logged 1st
        // suite-ready is logged 2nd
        // other events are from queue
        cy.wrap(requests).should('have.length.at.least', 2);

        cy.wrap(requests).its(0).should('have.property', 'c_type', EventType.SettingsAnalytics);
        cy.wrap(requests).its(1).should('have.property', 'c_type', EventType.SuiteReady);

        // settings/analytics
        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsAnalytics>>(
            requests,
            EventType.SettingsAnalytics,
        ).then(deviceConnectEvent => {
            expect(deviceConnectEvent.value).to.equal('true');
        });

        // suite-ready
        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SuiteReady>>(
            requests,
            EventType.SuiteReady,
        ).then(suiteReadyEvent => {
            expect(suiteReadyEvent.language).to.equal('cs');
            expect(suiteReadyEvent.enabledNetworks).to.equal('eth,tgor');
            expect(suiteReadyEvent.customBackends).to.equal('eth');
            expect(suiteReadyEvent.localCurrency).to.equal('czk');
            expect(suiteReadyEvent.bitcoinUnit).to.equal('sat');
            expect(suiteReadyEvent.discreetMode).to.equal('false');
            expect(suiteReadyEvent.screenWidth).to.exist.and.not.to.be.empty;
            expect(suiteReadyEvent.screenHeight).to.exist.and.not.to.be.empty;
            expect(suiteReadyEvent.platformLanguages).to.exist.and.not.to.be.empty;
            expect(suiteReadyEvent.tor).to.equal('false');
            expect(suiteReadyEvent.labeling).to.exist;
            expect(suiteReadyEvent.rememberedStandardWallets).to.equal('0');
            expect(suiteReadyEvent.rememberedHiddenWallets).to.equal('0');
            expect(suiteReadyEvent.theme).to.equal('dark');
            expect(parseInt(suiteReadyEvent.suiteVersion, 10)).to.not.equal(NaN);
            expect(suiteReadyEvent.earlyAccessProgram).to.equal('false');
            expect(suiteReadyEvent.browserName).to.equal(Cypress.browser.name);
            expect(parseInt(suiteReadyEvent.browserVersion, 10)).to.not.equal(NaN);
            expect(suiteReadyEvent.osName).to.exist.and.not.to.be.empty;
            expect(parseInt(suiteReadyEvent.osVersion, 10)).to.not.equal(NaN);
            expect(suiteReadyEvent.windowWidth).to.equal(windowWidth.toString());
            expect(suiteReadyEvent.windowHeight).to.equal(windowHeight.toString());
            expect(suiteReadyEvent.autodetectLanguage).to.equal('false');
            expect(suiteReadyEvent.autodetectTheme).to.equal('false');
        });
    });
});

export {};
