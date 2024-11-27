import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { test, expect } from '../../support/fixtures';

test.describe.serial('Suite works with Electrum server', () => {
    test.beforeAll(async () => {
        await TrezorUserEnvLink.stopBridge();
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu({ wipe: true });
        await TrezorUserEnvLink.setupEmu({
            needs_backup: true,
            mnemonic: 'mnemonic_all',
        });
    });

    test('Electrum completes discovery successfully', async ({
        onboardingPage,
        dashboardPage,
        topBar,
        settingsPage,
    }) => {
        test.info().annotations.push({
            type: 'dependency',
            description:
                'This test needs running RegTest docker. Read how to run this dependency in docs/tests/regtest.md',
        });
        const electrumUrl = '127.0.0.1:50001:t';
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();

        await topBar.openSettings();
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.coinsTabButton.click();
        await settingsPage.openCoinAdvanceSettings('regtest');
        await settingsPage.changeCoinBackend('electrum', electrumUrl);

        await topBar.openDashboard();
        await dashboardPage.discoveryShouldFinish();

        await expect(dashboardPage.balanceOfNetwork('regtest').first()).toBeVisible();
    });
});
