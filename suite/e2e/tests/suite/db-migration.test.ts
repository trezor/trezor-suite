import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const migrateFromVersion = 'release/25.10/web';
const migrateToVersion = 'develop/web';
const suiteDevInstance = 'https://dev.suite.sldev.cz/suite-web';

test.describe(
    'Database migration',
    // This test is run only on web nightly builds, it works with web instances of 25.10 and develop branch
    // On PR and release CI run it would provide no value and potentially false failures, same goes for canary firmware runs
    // Note: Trezor user env doesn't support legacy bridge versions on macOs, which is needed to connect the device to the old Suite version. Use linux or only run in CI.
    // Additionally, 25.10 does not support T3W1 yet
    { tag: ['@webOnly', '@nightlyOnly', '@T3T1', '@specificFirmware'] },
    () => {
        test.use({
            deviceSetup: { passphrase_protection: true, mnemonic: 'mnemonic_all' },
            bypassCSP: true,
        });

        test(
            `Db migration between: ${migrateFromVersion} => ${migrateToVersion}`,
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Verify that a user can successfully migrate from old version to new version.',
                    category: TestCategory.General,
                    priority: TestPriority.Medium,
                    steps: [
                        'Load Suite in old version 25.10 which preceded database changes',
                        'Change auto eject setting to true',
                        'Navigate to new version, develop instance, which should trigger indexdb migration',
                        'Check that auto eject setting is still true',
                    ],
                    stream: TestStream.Growth,
                }),
            },
            async ({ page, device, indexedDb, settingsPage }) => {
                await test.step(`Load suite in old version ${migrateFromVersion}`, async () => {
                    await page.goto(`${suiteDevInstance}/${migrateFromVersion}`);

                    await page.ensureStoreOnDesktop();
                    await page.evaluate(() => {
                        window.store.dispatch({
                            type: '@suite/toggle-firmware-hash-check',
                            payload: false,
                        });
                        window.store.dispatch({
                            type: '@suite/set-debug-mode',
                            payload: { showDebugMenu: true },
                        });
                        window.store.dispatch({
                            type: '@suite/set-flag',
                            key: 'hasSeenDisconnectTooltip',
                            value: true,
                        });
                    });

                    // The hardcoeded ids are needed because the test is run on a old version of the suite
                    // instance and the ids could be different in the new version.

                    await page.getByTestId('@analytics/continue-button').click();
                    await page.getByTestId('@onboarding/exit-app-button').click();
                    await page.getByTestId('@authenticity-check/start-button').click();
                    await expect(page.getByTestId('@prompts/confirm-on-device')).toBeVisible({
                        timeout: 30_000,
                    });
                    await device.pressYes();
                    await page.getByTestId('@authenticity-check/continue-button').click();
                    await page.discoveryShouldFinish();

                    await page.getByTestId('@suite/menu/settings').click();
                    await page.getByTestId('@settings/menu/general').click();
                    await page.getByTestId('@settings/auto-eject-switch').click();

                    await indexedDb.expectValue({
                        dbName: 'trezor-suite',
                        storeName: 'suiteSettings',
                        key: 'suite',
                        valuePath: 'settings.autoEject',
                        expectedValue: true,
                    });
                });

                await test.step(`Navigate to new version ${migrateToVersion} and check wallet status`, async () => {
                    await TrezorUserEnvLink.stopBridge();
                    await TrezorUserEnvLink.startBridge();
                    await page.goto(`${suiteDevInstance}/${migrateToVersion}`);
                    await indexedDb.expectValue({
                        dbName: 'trezor-suite',
                        storeName: 'walletSettings',
                        key: 'wallet',
                        valuePath: 'isAutoEjectEnabled',
                        expectedValue: true,
                    });
                    await settingsPage.navigateTo('application');
                    await expect(
                        settingsPage.autoEjectWalletSwitch.getByRole('switch'),
                    ).toHaveAttribute('aria-checked', 'true');
                });
            },
        );
    },
);
