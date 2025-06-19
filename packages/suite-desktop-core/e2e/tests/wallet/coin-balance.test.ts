import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { expect, test } from '../../support/fixtures';

test.describe('Coin balance', { tag: ['@group=wallet'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('Account balance is increased', async ({
        trezorUserEnvLink,
        dashboardPage,
        settingsPage,
        walletPage,
    }) => {
        await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
        await test.step('Regtest discovered with non zero value', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['regtest'] });
            await dashboardPage.navigateTo();
            await expect(walletPage.accountLabel({ symbol: 'regtest' })).toHaveText(
                'Bitcoin Regtest #1',
            );
            await expect(walletPage.balanceOfAccount('regtest')).toHaveTextGreaterThan(0);
        });

        await test.step('Balance is increased after sending another BTC', async () => {
            const originalBalanceText = await walletPage.balanceOfAccount('regtest').textContent();
            if (!originalBalanceText) {
                throw new Error('Balance text content is empty');
            }
            const originalBalance = BigNumber(originalBalanceText);
            const rawIncreasedBalance = originalBalance.plus(1).toString();
            const expectedIncreasedBalance = localizeNumber(rawIncreasedBalance, 'en', 0, 8);
            await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
            await expect(walletPage.balanceOfAccount('regtest')).toHaveText(
                expectedIncreasedBalance,
            );
        });
    });
});
