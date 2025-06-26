import { localizeNumber } from '@suite-common/wallet-utils';

import { getBigNumberFromBalance } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Coin balance', { tag: ['@group=wallet'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'Account balance is increased',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that the account balance is increased after receiving BTC.',
            }),
        },
        async ({ trezorUserEnvLink, dashboardPage, settingsPage, walletPage }) => {
            const firstAccountBalanceLocator = walletPage.balanceOfAccount('regtest').first();
            await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
            await test.step('Regtest discovered with non zero value', async () => {
                await settingsPage.changeNetworks({ enableNetworks: ['regtest'] });
                await dashboardPage.navigateTo();
                await expect(walletPage.accountLabel({ symbol: 'regtest' })).toHaveText(
                    'Bitcoin Regtest #1',
                );
                await expect(firstAccountBalanceLocator).toHaveTextGreaterThan(0);
            });

            await test.step('Balance is increased after sending another BTC', async () => {
                const { originalBalance, hasEllipsis } = await getBigNumberFromBalance(
                    firstAccountBalanceLocator,
                );
                const rawIncreasedBalance = originalBalance.plus(1).toString();
                const expectedIncreasedBalance =
                    localizeNumber(rawIncreasedBalance, 'en', 0, 8) + (hasEllipsis ? '…' : '');

                await trezorUserEnvLink.sendToAddressAndMineBlock({ address, btc_amount: 1 });
                await expect(firstAccountBalanceLocator).toHaveText(expectedIncreasedBalance);
            });
        },
    );
});
