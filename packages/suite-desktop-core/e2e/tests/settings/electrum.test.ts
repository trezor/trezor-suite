import { test, expect } from '../../support/fixtures';

test.use({
    emulatorStartConf: { wipe: true },
    emulatorSetupConf: { needs_backup: true, mnemonic: 'mnemonic_all' },
});

test.describe.serial(
    'Suite works with Electrum server',
    { tag: ['@group=settings', '@desktopOnly'] },
    () => {
        test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
        });

        test('Electrum completes discovery successfully', async ({
            dashboardPage,
            settingsPage,
        }) => {
            test.info().annotations.push({
                type: 'dependency',
                description:
                    'This test needs running RegTest docker. Read how to run this dependency in docs/tests/regtest.md',
            });
            const electrumUrl = '127.0.0.1:50001:t';

            await settingsPage.navigateTo();
            await settingsPage.coinsTabButton.click();
            await settingsPage.openNetworkAdvanceSettings('regtest');
            await settingsPage.changeCoinBackend('electrum', electrumUrl);

            await dashboardPage.navigateTo();
            await dashboardPage.discoveryShouldFinish();

            await expect(dashboardPage.balanceOfNetwork('regtest').first()).toBeVisible();
        });
    },
);
