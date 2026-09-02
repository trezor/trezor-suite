import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { Language, languageMap } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';

const migrateFromVersion = 'release/25.7/web';
const migrateToVersion = 'develop/web';
const suiteDevInstance = 'https://dev.suite.sldev.cz/suite-web';

test.describe(
    'Database migration',
    // This test is run only on web nightly builds, it works with web instances of 25.7 and develop branch
    // On PR and release CI run it would provide no value and potentially false failures, same goes for canary firmware runs
    // Note: Trezor user env doesn't support legacy bridge versions on macOs, which is needed to connect the device to the old Suite version. Use linux or only run in CI.
    { tag: ['@webOnly', '@nightlyOnly', '@T3T1', '@specificFirmware'] },
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
                    stream: TestStream.Growth,
                }),
            },
            async ({ onboardingPage, page }) => {
                await test.step(`Load suite in old version ${migrateFromVersion}`, async () => {
                    await TrezorUserEnvLink.stopBridge();
                    await TrezorUserEnvLink.startBridge('2.0.33');
                    await page.goto(`${suiteDevInstance}/${migrateFromVersion}`);
                    await onboardingPage.disableNecessaryFirmwareChecks();
                    await page.locator('[data-testid="@analytics/toggle-switch"]').click();
                    await page.locator('[data-testid="@analytics/continue-button"]').click();
                    await page.locator('[data-testid="@onboarding/exit-app-button"]').click();

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
                    await TrezorUserEnvLink.stopBridge();
                    await TrezorUserEnvLink.startBridge();
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
