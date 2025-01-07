import { test, expect } from '../../support/fixtures';

test.describe('Dashboard with regtest', { tag: ['@group=wallet'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';

    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: {
            mnemonic: 'mnemonic_all',
        },
    });

    test.beforeEach(async ({ trezorUserEnvLink, dashboardPage, onboardingPage }) => {
        await trezorUserEnvLink.startBridge();
        await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Regtest is in dashboard and gets updated when tx is created', async ({
        dashboardPage,
        settingsPage,
        walletPage,
    }) => {
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.enableNetwork('regtest');
        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
        await expect(walletPage.accountLabel({ symbol: 'regtest' })).toHaveText(
            'Bitcoin Regtest #1',
        );
        await expect(walletPage.balanceOfAccount('regtest')).toHaveTextGreaterThan(0);
    });
});
