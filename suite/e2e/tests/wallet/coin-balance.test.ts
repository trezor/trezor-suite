import { getBigNumberFromBalance } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Coin balance', { tag: ['@T3W1', '@T3T1'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
    });

    test(
        'Account balance is increased',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that the account balance is increased after receiving BTC.',
            }),
        },
        async ({ trezorUserEnv, dashboardPage, settingsPage, walletPage }) => {
            const firstAccountBalanceLocator = walletPage.balanceOfAccount({
                symbol: 'regtest',
                atIndex: 0,
            });
            await trezorUserEnv.sendToAddressAndMineBlock({ address, btc_amount: 1 });
            await test.step('Regtest discovered with non zero value', async () => {
                await settingsPage.toggleTestnetNetworks();
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
                let expectedIncreasedBalance: string;

                // adding 1 can overflow the balance length of 10 chars
                if (rawIncreasedBalance.length > 10) {
                    expectedIncreasedBalance = rawIncreasedBalance.slice(0, 10) + '…';
                    // keep ellipsis if was already present
                } else if (hasEllipsis) {
                    expectedIncreasedBalance = rawIncreasedBalance + '…';
                } else {
                    expectedIncreasedBalance = rawIncreasedBalance;
                }

                await trezorUserEnv.sendToAddressAndMineBlock({ address, btc_amount: 1 });
                await expect(firstAccountBalanceLocator).toHaveText(expectedIncreasedBalance);
            });
        },
    );
});
