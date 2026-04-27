import { events } from '@suite/analytics';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { Language, Theme } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { ExtractByEventType } from '../../support/types';

export enum Currency {
    EUR = 'eur',
    USD = 'usd',
}

test.describe('General settings', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ analytics, onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await analytics.interceptAnalytics();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
    });

    test(
        'Change settings on "general settings" page',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can change settings on the "General Settings" page.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ analytics, settingsPage, dashboardPage, page }) => {
            await test.step('Check default currency is USD', async () => {
                await expect(page.getByTestId('@dashboard/index')).toContainText('$0.00');
            });

            await test.step('Change fiat currency to EUR', async () => {
                await settingsPage.navigateTo('application');
                await page.getByTestId('@settings/fiat-select/input').click();
                await page.getByTestId(`@settings/fiat-select/option/${Currency.EUR}`).click();

                const settingsGeneralChangeFiatEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<(typeof events.settingsGeneralChangeFiatEvent)['name']>
                >(events.settingsGeneralChangeFiatEvent.name);
                expect(settingsGeneralChangeFiatEvent.fiat).toBe('eur');
            });

            await test.step('Check currency changed to EUR', async () => {
                await dashboardPage.navigateTo();
                await expect(page.getByTestId('@dashboard/index')).toContainText('€0.00');
            });

            await test.step('Change theme mode to Dark', async () => {
                await settingsPage.navigateTo('application');
                await settingsPage.changeTheme(Theme.Dark);

                const settingsGeneralChangeThemeEvent = analytics.findAnalyticsEventByType<
                    ExtractByEventType<(typeof events.settingsGeneralChangeThemeEvent)['name']>
                >(events.settingsGeneralChangeThemeEvent.name);
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
                    ExtractByEventType<(typeof events.settingsGeneralChangeLanguageEvent)['name']>
                >(events.settingsGeneralChangeLanguageEvent.name);
                expect(settingsGeneralChangeLanguageEvent.language).toBe('es-ES');
                expect(settingsGeneralChangeLanguageEvent.previousLanguage).toBe('en-US');
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
                    ExtractByEventType<(typeof events.settingsAnalyticsEvent)['name']>
                >(events.settingsAnalyticsEvent.name);
                expect(settingsAnalyticsEvent.value).toBe('false');
            });

            // TODO: enable this after https://github.com/trezor/trezor-suite/issues/13262 is fixed
            // //reset app button - wipes db, reloads app, shows onboarding again
            // await page.getByTestId('@settings/reset-app-button').click({ force: true });
            // await expect(page.getByTestId('@onboarding/welcome')).toBeVisible({ timeout: 20000 });
        },
    );
});
