import { readFileSync } from 'fs-extra';

import { test, expect } from '../../support/fixtures';

test.describe('Application Logs', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo();
    });

    test(
        'Display and export application logs',
        { tag: ['@webOnly'] },
        async ({ page }, testInfo) => {
            const displayedLogs = await test.step('Display application logs', async () => {
                await page.getByTestId('@settings/menu/general').click();
                await page.getByTestId('@settings/show-log-button').click();
                await expect(page.getByTestId('@modal/application-log')).toBeVisible();
                await expect(page.getByTestId('@log/content')).not.toBeEmpty();

                return page.getByTestId('@log/content').textContent();
            });

            const exportedLogPath =
                await test.step('Export application logs and save them to filesystem', async () => {
                    const downloadPromise = page.waitForEvent('download');
                    await page.getByTestId('@log/export-button').click();
                    const download = await downloadPromise;
                    const exportedLogsPath = `${testInfo.outputDir}/${download.suggestedFilename()}`;
                    await download.saveAs(exportedLogsPath);

                    return exportedLogsPath;
                });

            test.step('Compare displayed and exported logs', () => {
                const exportedLogs = readFileSync(exportedLogPath, 'utf-8');
                expect(exportedLogs).toBe(displayedLogs);
                testInfo.attachments.push({
                    name: 'exported-log.txt',
                    path: exportedLogPath,
                    contentType: 'text/plain',
                });
            });
        },
    );

    test('Display application logs', { tag: ['@desktopOnly'] }, async ({ page }) => {
        await page.getByTestId('@settings/menu/general').click();
        await page.getByTestId('@settings/show-log-button').click();
        await expect(page.getByTestId('@modal/application-log')).toBeVisible();
        await expect(page.getByTestId('@log/content')).not.toBeEmpty();
        await expect(page.getByTestId('@log/export-button')).toBeVisible();
        // Playwright does not support downloading files in electron, we would have to mock it
    });
});
