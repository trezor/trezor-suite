import { localizeNumber } from '@suite-common/wallet-utils';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import messages from '@trezor/suite/src/support/messages';
import { BigNumber } from '@trezor/utils';

import { calculatePercentageOfBalance } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

let ethereumStakingBalance: string | null;
const MOCKED_FEE_AMOUNT = 0.000290278609719;
const WITHDRAWAL_BUFFER = 0.03;

test.describe('ETH staking form', { tag: ['@group=staking'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coins.disableNetwork('btc');
            await settingsPage.coins.enableNetwork('eth');
            await settingsPage.coins.openNetworkAdvanceSettings('eth');
            await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);

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
        async ({ page, walletPage, stakingSection }) => {
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
                        .toHaveText('Minimum is 0.1 ETH', { timeout: 15_000 });
                });

                await test.step('Too many decimal digits', async () => {
                    await stakingSection.cryptoInput.fill('0.0000000000000000001');
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveText('Maximum 18 decimals allowed', { timeout: 15_000 });
                });

                await test.step('Not enough funds', async () => {
                    await stakingSection.cryptoInput.fill('4000');
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage, {
                            timeout: 15_000,
                        });
                });

                await test.step('Clear input and set minimum', async () => {
                    await stakingSection.cryptoInput.clear();
                    await expect
                        .soft(stakingSection.cryptoInputBottomText)
                        .toHaveText(messages['AMOUNT_IS_NOT_SET'].defaultMessage, {
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
                        await page.getByRole('button', { name: percentage + '%' }).click();
                        const expectedValue = calculatePercentageOfBalance({
                            percentage,
                            balance: ethereumStakingBalance!,
                            symbol: 'eth',
                        });
                        await expect.soft(stakingSection.cryptoInput).toHaveValue(expectedValue);
                    });
                }

                await test.step('Max of ETH balance', async () => {
                    await page.getByRole('button', { name: 'Max' }).click();
                    await expect
                        .soft(stakingSection.withdrawalWarning)
                        .toHaveText(
                            'We’ve left 0.03 ETH in your account so you can pay for withdrawal fees.',
                        );
                    const expectedMax = new BigNumber(ethereumStakingBalance!)
                        .minus(WITHDRAWAL_BUFFER)
                        .minus(MOCKED_FEE_AMOUNT);
                    const formattedExpectedMax = localizeNumber(
                        expectedMax.decimalPlaces(18, BigNumber.ROUND_UP),
                    );
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
