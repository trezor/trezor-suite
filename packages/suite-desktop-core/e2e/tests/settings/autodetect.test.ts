import { colorVariants } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { TR_ALLOW_ANALYTICS } from '../../../../suite-data/files/translations/es-ES.json';
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
        text: 'Anonymous data collection',
        textColor: colorVariants.standard.textDefault,
        bodyBackgroundColor: colorVariants.standard.backgroundSurfaceElevation0,
    },
    {
        testName: 'Dark English',
        userPreferences: { colorScheme: ColorScheme.Dark },
        text: 'Anonymous data collection',
        textColor: colorVariants.dark.textDefault,
        bodyBackgroundColor: colorVariants.dark.backgroundSurfaceElevation0,
    },
    {
        testName: 'Dark Spanish',
        userPreferences: { locale: 'es-ES', colorScheme: ColorScheme.Dark },
        text: TR_ALLOW_ANALYTICS,
        textColor: colorVariants.dark.textDefault,
        bodyBackgroundColor: colorVariants.dark.backgroundSurfaceElevation0,
    },
];

test.use({ startEmulator: false });
testCases.forEach(({ testName, userPreferences, text, textColor, bodyBackgroundColor }) => {
    test.describe('Language and theme detection', { tag: ['@group=settings'] }, () => {
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
