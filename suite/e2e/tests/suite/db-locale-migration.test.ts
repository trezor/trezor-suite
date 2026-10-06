import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { Language, languageMap } from '../../support/pageObjects/settings/settingsPage';
import { createTestAnnotation } from '../../support/reporters/annotations';

const migrateFromVersion = 'release/25.7/web';
const suiteDevInstance = 'https://dev.suite.sldev.cz/suite-web';
const developInstance = `${suiteDevInstance}/develop/web`;
// Locally the tested build runs on localhost, a different origin than the old instance, so the migration would never happen
const migrateTo = process.env.CI ? process.env.BASE_URL : developInstance;

test.describe(
    'Database migration',
    // Note: Trezor user env doesn't support legacy bridge versions on macOs, which is needed to connect the device to the old Suite version. Use linux or only run in CI.
    // Additionally, 25.10 does not support T3W1 yet
    { tag: ['@webOnly', '@optional', '@T3T1', '@specificFirmware'] },
    () => {
        test.use({
            deviceSetup: { passphrase_protection: true, mnemonic: 'mnemonic_all' },
        });

        test(
            `Db migration from ${migrateFromVersion} to current build`,
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

                await test.step('Navigate to current build and check locale status', async () => {
                    await TrezorUserEnvLink.stopBridge();
                    await TrezorUserEnvLink.startBridge();
                    await page.goto(migrateTo!);
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
