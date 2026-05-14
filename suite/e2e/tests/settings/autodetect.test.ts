import { messages } from '@suite/intl';
import { TR_ONBOARDING_DATA_COLLECTION_HEADING as SPANISH_TR_ONBOARDING_DATA_COLLECTION_HEADING } from '@trezor/suite-data/files/translations/es-ES.json';
import { colorVariants } from '@trezor/theme';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

enum ColorScheme {
    Light = 'light',
    Dark = 'dark',
}

const hexToSerializedCssColor = (hex: string) => {
    const normalizedHex = hex.replace('#', '');
    const fullHex = normalizedHex.length === 6 ? normalizedHex + 'FF' : normalizedHex;

    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);
    const alpha = parseInt(fullHex.slice(6, 8), 16) / 255;

    if (alpha < 1) {
        return `rgba(${r}, ${g}, ${b}, ${Number(alpha.toFixed(2))})`;
    }

    return `rgb(${r}, ${g}, ${b})`;
};

const testCases = [
    {
        testName: 'Light English',
        userPreferences: { colorScheme: ColorScheme.Light },
        text: messages['TR_ONBOARDING_DATA_COLLECTION_HEADING'].defaultMessage,
        textColor: colorVariants.standard.contentPrimary,
        bodyBackgroundColor: colorVariants.standard.surfaceFillPage,
    },
    {
        testName: 'Dark English',
        userPreferences: { colorScheme: ColorScheme.Dark },
        text: messages['TR_ONBOARDING_DATA_COLLECTION_HEADING'].defaultMessage,
        textColor: colorVariants.dark.contentPrimary,
        bodyBackgroundColor: colorVariants.dark.surfaceFillPage,
    },
    {
        testName: 'Dark Spanish',
        userPreferences: { locale: 'es-ES', colorScheme: ColorScheme.Dark },
        text: SPANISH_TR_ONBOARDING_DATA_COLLECTION_HEADING,
        textColor: colorVariants.dark.contentPrimary,
        bodyBackgroundColor: colorVariants.dark.surfaceFillPage,
    },
];

test.use({ startEmulator: false });
testCases.forEach(({ testName, userPreferences, text, textColor, bodyBackgroundColor }) => {
    test.describe('Language and theme detection', { tag: ['@noDevice'] }, () => {
        test.use(userPreferences);
        test(
            testName,
            {
                annotation: createTestAnnotation({
                    testCase: `Suite adopts preferences of the browser: ${testName}`,
                }),
            },
            async ({ onboardingPage, analyticsSection }) => {
                await onboardingPage.optionallyDismissFwHashCheckError();
                await expect(analyticsSection.heading).toHaveText(text);
                await expect(analyticsSection.heading).toHaveCSS(
                    'color',
                    hexToSerializedCssColor(textColor),
                );
                await expect(onboardingPage.page.locator('body')).toHaveCSS(
                    'background-color',
                    hexToSerializedCssColor(bodyBackgroundColor),
                );
            },
        );
    });
});
