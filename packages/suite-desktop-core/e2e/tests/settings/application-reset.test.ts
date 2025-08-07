import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { Language, Theme } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';
//import { launchSuite } from '../../support/electron';

test.describe('Reset application', { tag: ['@group=settings'] }, () => {
    test(
        'Reset application',
        {
            annotation: createTestAnnotation({
                testCase: 'Reset application',
                prerequisites: ['Trezor Suite application'],
                steps: [
                    'Navigate to Settings/Application',
                    'Click on Reset app',
                    'Suite should restart with Settings reset',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
                osMatrix: [
                    TestOsMatrix.Linux,
                    TestOsMatrix.Windows,
                    TestOsMatrix.MacOSArm,
                    TestOsMatrix.MacOSIntel,
                ],
            }),
        },
        async ({settingsPage, onboardingPage, page} ) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await settingsPage.changeTheme(Theme.Dark);
            await settingsPage.changeLanguage(Language.Czech);
            await page.getByTestId('@settings/reset-app-button').click();
        // TODO: Uncomment when the reset app functionality is implemented for desktop
        //     const suite = await launchSuite({
        //     artefactFolder: testInfo.outputDir,
        //     viewport: testInfo.project.use.viewport!,
        // });
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await expect(settingsPage.themeInput).toHaveText('System');
            await expect(settingsPage.languageInput).toHaveText('System');
        },

    );
});
