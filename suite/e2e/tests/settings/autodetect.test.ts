import { messages } from '@suite/intl';
import { TR_ONBOARDING_DATA_COLLECTION_HEADING as SPANISH_TR_ONBOARDING_DATA_COLLECTION_HEADING } from '@trezor/suite-data/files/translations/es-ES.json';
import { colorVariants } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

enum ColorScheme {
    Light = 'light',
    Dark = 'dark',
}

const testCases = [
    {
        testName: 'Light English',
        userPreferences: { colorScheme: ColorScheme.Light },
        text: messages['TR_ONBOARDING_DATA_COLLECTION_HEADING'].defaultMessage,
        textColor: colorVariants.standard.textDefault,
        bodyBackgroundColor: colorVariants.standard.backgroundSurfaceElevation0,
    },
    {
        testName: 'Dark English',
        userPreferences: { colorScheme: ColorScheme.Dark },
        text: messages['TR_ONBOARDING_DATA_COLLECTION_HEADING'].defaultMessage,
        textColor: colorVariants.dark.textDefault,
        bodyBackgroundColor: colorVariants.dark.backgroundSurfaceElevation0,
    },
    {
        testName: 'Dark Spanish',
        userPreferences: { locale: 'es-ES', colorScheme: ColorScheme.Dark },
        text: SPANISH_TR_ONBOARDING_DATA_COLLECTION_HEADING,
        textColor: colorVariants.dark.textDefault,
        bodyBackgroundColor: colorVariants.dark.backgroundSurfaceElevation0,
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
                await expect(analyticsSection.heading).toHaveCSS('color', hexToRgba(textColor));
                await expect(onboardingPage.page.locator('body')).toHaveCSS(
                    'background-color',
                    hexToRgba(bodyBackgroundColor),
                );
            },
        );
    });
});
