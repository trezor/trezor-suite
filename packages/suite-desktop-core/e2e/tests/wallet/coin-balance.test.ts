import { test, expect } from '../../support/fixtures';

test.describe('Coin balance', { tag: ['@group=wallet'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ dashboardPage, onboardingPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Account balance is increased', async ({
        trezorUserEnvLink,
        dashboardPage,
        settingsPage,
        walletPage,
    }) => {
        await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
        await test.step('Regtest discovered with non zero value', async () => {
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('regtest');
            await dashboardPage.navigateTo();
            await dashboardPage.discoveryShouldFinish();
            await expect(walletPage.accountLabel({ symbol: 'regtest' })).toHaveText(
                'Bitcoin Regtest #1',
            );
            await expect(walletPage.balanceOfAccount('regtest')).toHaveTextGreaterThan(0);
        });

        await test.step('Balance is increased after sending another BTC', async () => {
            const originalValue = await walletPage.balanceOfAccount('regtest').textContent();
            const expectedIncreasedValue = (Number(originalValue) + 1).toString();
            await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
            await expect(walletPage.balanceOfAccount('regtest')).toHaveText(expectedIncreasedValue);
        });
    });
});
