import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

// The monerod binary download is mocked via the `--mock-monerod` switch passed by the
// e2e launcher (see support/electron.ts), so this verifies the toggle + download-progress
// UI without fetching the real (~150MB) daemon.
test.describe('Monero local node settings', { tag: ['@T3T1', '@desktopOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'User can enable the local Monero node and see download progress',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Enabling the "Local Monero node" toggle starts the daemon download and shows progress feedback.',
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async ({ settingsPage }) => {
            await test.step('Toggle is present and off by default', async () => {
                // The Monero node lives behind the "experimental networks" feature, so it has to be
                // turned on before the toggle is rendered in the general settings.
                await settingsPage.enableExperimentalNetworks();
                await expect(settingsPage.monerodToggle).toBeVisible();
                await expect(settingsPage.monerodToggleInput).not.toBeChecked();
            });

            await test.step('Enabling the toggle turns it on', async () => {
                await settingsPage.monerodToggle.click({ force: true });
                await expect(settingsPage.monerodToggleInput).toBeChecked();
            });

            await test.step('Download starts and shows visual progress', async () => {
                await expect(settingsPage.monerodProgress).toBeVisible();
                await expect(settingsPage.monerodPercentage).toContainText(/100\s*%/, {
                    timeout: 10_000,
                });
            });
        },
    );
});
