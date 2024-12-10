import { ExtractByEventType } from '@trezor/suite-web/e2e/support/types';
import { EventType } from '@trezor/suite-analytics';

import { test, expect } from '../../support/fixtures';
import { Language, Theme } from '../../support/pageActions/settingsActions';

export enum Currency {
    EUR = 'eur',
    USD = 'usd',
}

test.describe('General settings', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ analytics, onboardingPage }) => {
        await onboardingPage.completeOnboarding();
        await analytics.interceptAnalytics();
    });

    test('Change settings on "general settings" page', async ({
        analytics,
        settingsPage,
        dashboardPage,
        window: page,
    }) => {
        await test.step('Check default currency is USD', async () => {
            await expect(page.getByTestId('@dashboard/index')).toContainText('$0.00');
        });

        await test.step('Change fiat currency to EUR', async () => {
            await settingsPage.navigateTo();
            await page.getByTestId('@settings/fiat-select/input').click();
            await page.getByTestId(`@settings/fiat-select/option/${Currency.EUR}`).click();

            const settingsGeneralChangeFiatEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<EventType.SettingsGeneralChangeFiat>
            >(EventType.SettingsGeneralChangeFiat);
            expect(settingsGeneralChangeFiatEvent.fiat).toBe('eur');
        });

        await test.step('Check currency changed to EUR', async () => {
            await dashboardPage.navigateTo();
            await expect(page.getByTestId('@dashboard/index')).toContainText('€0.00');
        });

        await test.step('Change theme mode to Dark', async () => {
            await settingsPage.navigateTo();
            await settingsPage.changeTheme(Theme.Dark);

            const settingsGeneralChangeThemeEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<EventType.SettingsGeneralChangeTheme>
            >(EventType.SettingsGeneralChangeTheme);
            expect(settingsGeneralChangeThemeEvent.platformTheme).toBe(Theme.Light);
            expect(settingsGeneralChangeThemeEvent.previousTheme).toBe(Theme.Light);
            expect(settingsGeneralChangeThemeEvent.previousAutodetectTheme).toBe('true');
            expect(settingsGeneralChangeThemeEvent.autodetectTheme).toBe('false');
            expect(settingsGeneralChangeThemeEvent.theme).toBe(Theme.Dark);
        });

        await test.step('Check suite version is visible', async () => {
            await expect(page.getByTestId('@settings/suite-version')).toBeVisible();
        });

        await test.step('Change language to Spanish', async () => {
            await settingsPage.changeLanguage(Language.Spanish);

            const settingsGeneralChangeLanguageEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<EventType.SettingsGeneralChangeLanguage>
            >(EventType.SettingsGeneralChangeLanguage);
            expect(settingsGeneralChangeLanguageEvent.language).toBe('es');
            expect(settingsGeneralChangeLanguageEvent.previousLanguage).toBe('en');
            expect(settingsGeneralChangeLanguageEvent.autodetectLanguage).toBe('false');
            expect(settingsGeneralChangeLanguageEvent.previousAutodetectLanguage).toBe('true');
            expect(settingsGeneralChangeLanguageEvent.platformLanguages).toBe('en-US');
        });

        await test.step('Toggle Data usage analytics', async () => {
            await expect(
                page.getByTestId('@analytics/toggle-switch').locator('input'),
            ).toBeChecked();
            await page.getByTestId('@analytics/toggle-switch').click({ force: true });
            await expect(
                page.getByTestId('@analytics/toggle-switch').locator('input'),
            ).not.toBeChecked();

            const settingsAnalyticsEvent = analytics.findAnalyticsEventByType<
                ExtractByEventType<EventType.SettingsAnalytics>
            >(EventType.SettingsAnalytics);
            expect(settingsAnalyticsEvent.value).toBe('false');
        });

        // TODO: enable this after https://github.com/trezor/trezor-suite/issues/13262 is fixed
        // //reset app button - wipes db, reloads app, shows onboarding again
        // await page.getByTestId('@settings/reset-app-button').click({ force: true });
        // await expect(page.getByTestId('@onboarding/welcome')).toBeVisible({ timeout: 20000 });
    });
});
