import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getBigNumberFromBalance } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Coin balance', { tag: ['@T3W1', '@T3T1'] }, () => {
    const address = 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v';
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
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
                const { originalBalance } = await getBigNumberFromBalance(
                    firstAccountBalanceLocator,
                );

                const increasedBalance = originalBalance.plus(1);

                // The compact format abbreviates from a million upwards (`1.00M`), which this
                // expectation does not model.
                expect(increasedBalance.abs().isLessThan(1_000_000)).toBe(true);

                const expectedIncreasedBalance = localizeNumber(
                    increasedBalance.decimalPlaces(2, BigNumber.ROUND_DOWN),
                    'en-US',
                    2,
                    2,
                );

                await trezorUserEnv.sendToAddressAndMineBlock({ address, btc_amount: 1 });
                await expect(firstAccountBalanceLocator).toHaveText(expectedIncreasedBalance);
            });
        },
    );
});
