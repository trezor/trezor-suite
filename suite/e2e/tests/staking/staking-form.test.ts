import { localizeNumber } from '@suite-common/wallet-utils';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import { calculatePercentageOfBalance } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

let ethereumStakingBalance: string | null;
const WITHDRAWAL_BUFFER = 0.005;

test.describe('ETH staking form', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coinsTab.disableNetwork('btc');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'Staking form % inputs and limits',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use staking form functions.',
                category: TestCategory.ETH,
                priority: TestPriority.Medium,
                stream: TestStream.Trends,
            }),
        },
        async ({ walletPage, stakingSection }) => {
            await test.step('Identify possible staking balance', async () => {
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                ethereumStakingBalance = await walletPage.topPanelBalance.textContent();
                if (!ethereumStakingBalance) {
                    throw new Error('Ethereum staking balance is undefined or null');
                }
                ethereumStakingBalance = ethereumStakingBalance?.replace(/,/g, '');
                await stakingSection.stakingTabButton.click();
                await stakingSection.stakeMoreButton.click();
            });

            await test.step('Check limits for staking', async () => {
                await test.step('Below minimum', async () => {
                    await stakingSection.cryptoInput.fill('0.00000001');

                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveTranslation('TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO', {
                            values: { minimum: '0.1 ETH' },
                            timeout: 15_000,
                        });
                });

                await test.step('Too many decimal digits', async () => {
                    await stakingSection.cryptoInput.fill('0.0000000000000000001');
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveTranslation('AMOUNT_IS_NOT_IN_RANGE_DECIMALS', {
                            values: { decimals: '18' },
                            timeout: 15_000,
                        });
                });

                await test.step('Not enough funds', async () => {
                    await stakingSection.cryptoInput.fill('4000');
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveTranslation('AMOUNT_IS_NOT_ENOUGH', {
                            timeout: 15_000,
                        });
                });

                await test.step('Clear input and set minimum', async () => {
                    await stakingSection.cryptoInput.clear();
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveTranslation('AMOUNT_IS_NOT_SET', {
                            timeout: 15_000,
                        });

                    await stakingSection.cryptoInput.fill('0.1');
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toBeHidden({ timeout: 15_000 });
                });
            });

            await test.step('Try all % inputs for Eth staking', async () => {
                for (const percentage of [10, 25, 50]) {
                    await test.step(`${percentage}% of ETH balance`, async () => {
                        await stakingSection.cryptoInputFractionButtons
                            .getByRole('button', { name: percentage + '%' })
                            .click();
                        const expectedValue = calculatePercentageOfBalance({
                            percentage,
                            balance: ethereumStakingBalance!,
                            symbol: 'eth',
                        });
                        await expect.soft(stakingSection.cryptoInput).toHaveValue(expectedValue);
                    });
                }

                await test.step('Max of ETH balance', async () => {
                    await stakingSection.cryptoInputFractionButtons
                        .getByRole('button', { name: 'Max' })
                        .click();
                    await expect
                        .soft(stakingSection.withdrawalWarning)
                        .toHaveTranslation('TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL', {
                            values: { amount: '0.005', networkDisplaySymbol: 'ETH' },
                        });
                    const expectedMax = new BigNumber(ethereumStakingBalance!).minus(
                        WITHDRAWAL_BUFFER,
                    );
                    const formattedExpectedMax = localizeNumber(expectedMax);
                    await expect.soft(stakingSection.cryptoInput).toHaveValue(formattedExpectedMax);
                });
            });

            await test.step('Switch to Fiat and back', async () => {
                const cryptoValue = 500;
                const ratioToFiat = 0.5; // Mocked ratio for testing
                const fiatValue = cryptoValue * ratioToFiat;
                await stakingSection.cryptoInput.fill(cryptoValue.toString());
                await stakingSection.switchInputs.click();
                await expect.soft(stakingSection.fiatInput).toHaveValue(fiatValue.toString());
                await expect.soft(stakingSection.fiatTicker).toHaveText('USD');
                await stakingSection.switchInputs.click();
                await expect.soft(stakingSection.cryptoInput).toHaveValue(cryptoValue.toString());
                await expect.soft(stakingSection.cryptoTicker).toHaveText('ETH');
            });
        },
    );
});
