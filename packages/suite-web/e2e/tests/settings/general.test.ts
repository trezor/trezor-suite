// @group:settings
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('General settings', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu', { needs_backup: false });
        cy.task('startBridge');
        // use portrait mode monitor to prevent scrolling in settings
        cy.viewport(1080, 1440).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    it('Change settings on "general settings" page', () => {
        // usd is default currency
        cy.getTestElement('@dashboard/index').should('contain', '$0.00');

        // go to settings
        cy.getTestElement('@suite/menu/settings').click();

        // close desktop banner
        cy.getTestElement('@banner/install-desktop-suite/close-button').click({
            scrollBehavior: false,
        });

        // change fiat
        cy.getTestElement('@settings/fiat-select/input').click({ scrollBehavior: false });
        cy.getTestElement('@settings/fiat-select/option/eur').click();

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsGeneralChangeFiat>>(
            requests,
            EventType.SettingsGeneralChangeFiat,
        ).then(settingsGeneralChangeFiatEvent => {
            expect(settingsGeneralChangeFiatEvent.fiat).to.equal('eur');
        });

        // go to dashboard and check currency
        cy.getTestElement('@suite/menu/suite-index').click();
        cy.getTestElement('@dashboard/index').should('contain', '€0.00');

        // go to settings
        cy.getTestElement('@suite/menu/settings').click();

        // change dark mode
        cy.getTestElement('@theme/color-scheme-select/input').click();
        cy.getTestElement('@theme/color-scheme-select/option/dark').click();
        cy.getTestElement('@theme/color-scheme-select/input').should('contain', 'Dark');

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsGeneralChangeTheme>>(
            requests,
            EventType.SettingsGeneralChangeTheme,
        ).then(settingsGeneralChangeThemeEvent => {
            expect(settingsGeneralChangeThemeEvent.platformTheme).to.not.be.undefined;
            expect(settingsGeneralChangeThemeEvent.previousTheme).to.not.be.undefined;
            expect(settingsGeneralChangeThemeEvent.previousAutodetectTheme).to.equal('true');
            expect(settingsGeneralChangeThemeEvent.autodetectTheme).to.equal('false');
            expect(settingsGeneralChangeThemeEvent.theme).to.equal('dark');
        });

        // there is suite version also listed
        cy.contains('Suite version');
        cy.contains('You are currently running version');

        // change language
        cy.getTestElement('@settings/language-select/input').click({ scrollBehavior: 'bottom' });
        cy.getTestElement('@settings/language-select/option/es').click();
        cy.getTestElement('@settings/language-select/input').should('contain', 'Español');

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsGeneralChangeLanguage>>(
            requests,
            EventType.SettingsGeneralChangeLanguage,
        ).then(settingsGeneralChangeLanguageEvent => {
            expect(settingsGeneralChangeLanguageEvent.language).to.equal('es');
            expect(settingsGeneralChangeLanguageEvent.previousLanguage).to.equal('en');
            expect(settingsGeneralChangeLanguageEvent.autodetectLanguage).to.equal('false');
            expect(settingsGeneralChangeLanguageEvent.previousAutodetectLanguage).to.equal('true');
            expect(settingsGeneralChangeLanguageEvent.platformLanguages).to.not.be.undefined;
        });

        // toggle analytics
        cy.getTestElement('@analytics/toggle-switch').find('input').should('be.checked');
        cy.getTestElement('@analytics/toggle-switch').click({ force: true });
        cy.getTestElement('@analytics/toggle-switch').find('input').should('not.be.checked');

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.SettingsAnalytics>>(
            requests,
            EventType.SettingsAnalytics,
        ).then(settingsAnalyticsEvent => {
            expect(settingsAnalyticsEvent.value).to.equal('false');
        });

        // and reset app button - wipes db, reloads app, shows onboarding again
        cy.getTestElement('@settings/reset-app-button').click();
        cy.getTestElement('@onboarding/welcome');
    });
});

export {};
