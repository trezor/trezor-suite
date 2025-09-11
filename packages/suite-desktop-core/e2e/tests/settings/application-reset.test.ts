import { TestCategory, TestOsMatrix, TestPriority, TestStream } from '@trezor/e2e-utils';

import { launchSuite } from '../../support/electron';
import { expect, test } from '../../support/fixtures';
import { AnalyticsSection } from '../../support/pageObjects/analyticsSection';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { OnboardingPage } from '../../support/pageObjects/onboarding/onboardingPage';
import { Language, SettingsPage, Theme } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { enhancePage } from '../../support/testExtends/enhancePage';


test.describe('Reset application', { tag: ['@group=settings'] }, () => {
    test(
        'Reset web application',
        {
            tag: ['@webOnly'],
            annotation: createTestAnnotation({
                testCase: 'Reset web application',
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
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await expect(settingsPage.themeInput).toHaveText('System');
            await expect(settingsPage.languageInput).toHaveText('System');
        },

    );
    test(
        'Reset desktop application',
        {
            tag: ['@desktopOnly'],
            annotation: createTestAnnotation({
                testCase: 'Reset desktop application',
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
        async ({settingsPage, onboardingPage, page, emulatorStartConf}, testInfo
        ) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('application');
            await settingsPage.changeTheme(Theme.Dark);
            await settingsPage.changeLanguage(Language.Czech);
            await page.getByTestId('@settings/reset-app-button').click();

            await new Promise(resolve => setTimeout(resolve, 3000));

            const suite = await launchSuite({
            keepUserData: true,
            artefactFolder: testInfo.outputDir,
            viewport: testInfo.project.use.viewport!,
        });
         enhancePage(suite.window);
        const devicePrompt = new DevicePrompt (suite.window);
        const analyticsSection = new AnalyticsSection (suite.window);
        const onboardingPageAfterRestart = new OnboardingPage(
                        suite.window,
                        emulatorStartConf.model,
                        testInfo,
                        devicePrompt,
                        analyticsSection,
        );
        const settingsPageAfterRestart = new SettingsPage(
                        suite.window
        );
        // TODO: Modify global teardown to gracefully handle the restart
            await onboardingPageAfterRestart.completeOnboarding();
            await settingsPageAfterRestart.navigateTo('application');
            await expect(settingsPageAfterRestart.themeInput).toHaveText('System');
            await expect(settingsPageAfterRestart.languageInput).toHaveText('System');
            await suite.electronApp.close();
        },

    );
});
