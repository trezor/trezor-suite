import { test } from '@playwright/test';

import { TR_ONBOARDING_DATA_COLLECTION_HEADING as SPANISH_CONSENT_HEADING } from '@trezor/suite-data/files/translations/es-ES.json';
import { colorVariants } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { expect } from '../support/customMatchers';

/**
 * Suite adopts the browser's theme and language preferences.
 *
 * Replaces `suite/e2e/tests/settings/autodetect.test.ts`, which booted the whole app three times
 * (and started an emulator-less Suite per case) to assert computed CSS values.
 */
const themes = [
    { colorScheme: 'light', palette: colorVariants.standard },
    { colorScheme: 'dark', palette: colorVariants.dark },
] as const;

themes.forEach(({ colorScheme, palette }) => {
    test.describe(`${colorScheme} theme`, () => {
        test.use({ colorScheme });

        test('is adopted from the browser preference', async ({ page, mount }) => {
            const component = await mount('autodetect/AnalyticsConsent');

            await expect(component.getByTestId('@analytics/consent/heading')).toHaveCSS(
                'color',
                hexToRgba(palette.contentPrimary),
            );
            await expect(page.locator('body')).toHaveCSS(
                'background-color',
                hexToRgba(palette.surfaceFillPage),
            );
        });
    });
});

test.describe('English locale', () => {
    test.use({ locale: 'en-US' });

    test('renders the consent heading in English', async ({ mount }) => {
        const component = await mount('autodetect/AnalyticsConsent');

        await expect(component.getByTestId('@analytics/consent/heading')).toHaveTranslation(
            'TR_ONBOARDING_DATA_COLLECTION_HEADING',
        );
    });
});

test.describe('Spanish locale', () => {
    test.use({ locale: 'es-ES' });

    test('renders the consent heading in Spanish', async ({ mount }) => {
        const component = await mount('autodetect/AnalyticsConsent');

        // Asserted against the shipped catalogue rather than a literal, so a Crowdin sync cannot
        // break this test.
        await expect(component.getByTestId('@analytics/consent/heading')).toHaveText(
            SPANISH_CONSENT_HEADING,
        );
    });
});
