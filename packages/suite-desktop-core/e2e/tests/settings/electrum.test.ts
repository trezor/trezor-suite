import { test, expect } from '../../support/fixtures';

test.describe.serial('Suite works with Electrum server', () => {
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Electrum completes discovery successfully', async ({ dashboardPage, settingsPage }) => {
        test.info().annotations.push({
            type: 'dependency',
            description:
                'This test needs running RegTest docker. Read how to run this dependency in docs/tests/regtest.md',
        });
        const electrumUrl = '127.0.0.1:50001:t';

        await settingsPage.navigateTo();
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.coinsTabButton.click();
        await settingsPage.openCoinAdvanceSettings('regtest');
        await settingsPage.changeCoinBackend('electrum', electrumUrl);

        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();

        await expect(dashboardPage.balanceOfNetwork('regtest').first()).toBeVisible();
    });
});
