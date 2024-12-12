import { test, expect } from '../../support/fixtures';

const veryDarkGreyColor = 'rgb(23, 23, 23)';
const darkGreyColor = 'rgb(31, 31, 31)';
const veryLightGreyColor = 'rgb(246, 246, 246)';
const lightGreyColor = 'rgb(234, 235, 237)';
enum ColorScheme {
    Light = 'light',
    Dark = 'dark',
}

const testCases = [
    {
        testName: 'Light English',
        userPreferences: { colorScheme: ColorScheme.Light },
        text: 'Anonymous data collection',
        textColor: darkGreyColor,
        bodyBackgroundColor: veryLightGreyColor,
    },
    {
        testName: 'Dark English',
        userPreferences: { colorScheme: ColorScheme.Dark },
        text: 'Anonymous data collection',
        textColor: lightGreyColor,
        bodyBackgroundColor: veryDarkGreyColor,
    },
    {
        testName: 'Dark Spanish',
        userPreferences: { locale: 'es-ES', colorScheme: ColorScheme.Dark },
        text: 'Recogida de datos anónimos',
        textColor: lightGreyColor,
        bodyBackgroundColor: veryDarkGreyColor,
    },
];

test.use({ startEmulator: false });
testCases.forEach(({ testName, userPreferences, text, textColor, bodyBackgroundColor }) => {
    test.describe.serial('Language and theme detection', { tag: ['@group=settings'] }, () => {
        test.use(userPreferences);
        test(testName, async ({ onboardingPage }) => {
            await onboardingPage.optionallyDismissFwHashCheckError();
            await expect(onboardingPage.analyticsHeading).toHaveText(text);
            await expect(onboardingPage.analyticsHeading).toHaveCSS('color', textColor);
            await expect(onboardingPage.page.locator('body')).toHaveCSS(
                'background-color',
                bodyBackgroundColor,
            );
        });
    });
});
