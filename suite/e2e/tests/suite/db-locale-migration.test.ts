import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { Language, languageMap } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';

const migrateFromVersion = 'release/25.7/web';
const migrateToVersion = 'develop/web';
const suiteDevInstance = 'https://dev.suite.sldev.cz/suite-web';

test.describe(
    'Database migration',
    // This test is run only on web nightly builds, it works with web instances of 25.7 and develop branch
    // On PR and release CI run it would provide no value and potentially false failures
    { tag: ['@webOnly', '@nightlyOnly', '@T3T1'] },
    () => {
        test.use({
            deviceSetup: { passphrase_protection: true, mnemonic: 'mnemonic_all' },
        });

        test(
            `Db migration between: ${migrateFromVersion} => ${migrateToVersion}`,
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Verify that a user can successfully migrate from old version to new version.',
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                }),
            },
            async ({ onboardingPage, page }) => {
                await test.step(`Load suite in old version ${migrateFromVersion}`, async () => {
                    await page.goto(`${suiteDevInstance}/${migrateFromVersion}`);
                    await onboardingPage.disableNecessaryFirmwareChecks();
                    await page.locator('[data-testid="@analytics/toggle-switch"]').click();
                    await page.locator('[data-testid="@analytics/continue-button"]').click();
                    await page.locator('[data-testid="@onboarding/complete-onboarding"]').click();

                    await expect(page.locator('[data-testid="@suite/loading"]')).toBeHidden();
                });

                await test.step('Set Spanish as language', async () => {
                    await page.locator('[data-testid="@suite/menu/settings"]').click();
                    await page.locator('[data-testid="@settings/language-select/input"]').click();
                    await page
                        .locator('[data-testid="@settings/language-select/option/es"]')
                        .click();
                });

                await test.step(`Navigate to new version ${migrateToVersion} and check locale status`, async () => {
                    await page.goto(`${suiteDevInstance}/${migrateToVersion}`);
                    await onboardingPage.disableNecessaryFirmwareChecks();

                    await page.locator('[data-testid="@suite/menu/settings"]').click();
                    await expect(
                        page.locator('[data-testid="@settings/language-select/input"]'),
                    ).toHaveText(languageMap[Language.Spanish]);
                });
            },
        );
    },
);
