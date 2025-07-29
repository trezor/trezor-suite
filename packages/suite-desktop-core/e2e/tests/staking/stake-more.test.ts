import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import ETH_STAKE_PENDING_TX from '../../fixtures/staking/eth-stake-pending-tx.json';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../support/testExtends/customMatchers';

test.describe('ETH staking', { tag: ['@group=staking'] }, () => {
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

            blockbookMock.updateAccountState({
                stakingPools: [
                    {
                        contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                        name: 'Everstake',
                        pendingBalance: '0', //sets to zero
                        pendingDepositedBalance: '0', //sets to zero
                        depositedBalance: '3000000000000000000000',
                        withdrawTotalAmount: '4000000000000000000000',
                        claimableAmount: '5000000000000000000000',
                        restakedReward: '234000000000000000000',
                        autocompoundBalance: '7000000000000000000000',
                    },
                ],
            });
        },
    );

    test(
        'stake on ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake from his Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, stakingSection, devicePrompt, blockbookMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.pendingAmount).toBeHidden();
                await expect(stakingSection.stakedAmount).toHaveText('3,000');
                await expect(stakingSection.rewardsAmount).toHaveText('234');
                await expect(stakingSection.unstakingAmount).toHaveText('4,000');
                await stakingSection.expectProgressIndicatorsToMatchPhase('receivingRewards');
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.stakeMoreButton.click();
                await expect(
                    page.getByTestId('@staking/available-balance-with-symbol'),
                ).toContainText('1,234 ETH');
                await stakingSection.cryptoInput.fill('0.100204158497493752');
            });

            await test.step('Initiate staking and confirm on device', async () => {
                await stakingSection.continueButton.click();
                await stakingSection.acknowledgeCheckbox.click();
                await stakingSection.confirmAndStakeButton.click();

                await expect(devicePrompt.outputValueOf('data')).toHaveText(
                    'Stake ETH on Everstake?',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [['Stake ETH on', '\n', 'Everstake?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.outputValueOf('amount')).toHaveText(
                    '0.100204158497493752 ETH',
                );
                await expect(devicePrompt.outputValueOf('fee')).toHaveText('0.000290278609719 ETH');

                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [
                        ['Amount'],
                        splitStringByDisplayLimit('0.100204158497493752 ETH'),
                        [' '],
                        ['Maximum fee'],
                        splitStringByDisplayLimit('0.000290278609719 ETH'),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                blockbookMock.updateAccountState({
                    balance: '1233899795841502506248', // lowered by staked amount
                    transactions: [ETH_STAKE_PENDING_TX, ETH_BASE_TX],
                    unconfirmedTxs: 1,
                    txs: 2,
                    nonTokenTxs: 2,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '100204158497493752', // increased by staked amount
                            pendingDepositedBalance: '0',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '7000000000000000000000',
                        },
                    ],
                    nonce: '2',
                });
                await devicePrompt.sendButton.click();
            });

            await test.step('Verify pending transaction', async () => {
                await expect(stakingSection.pendingTransactionText).toBeVisible();
                await expect(stakingSection.transactionStatus).toHaveText('Confirming transaction');
                await stakingSection.expectProgressIndicatorsToMatchPhase('pendingTransaction');
                await expect(stakingSection.speedUpButton).toBeEnabled();
                await expect(stakingSection.pendingAmount).toHaveText('0.100204158497493752');
                await expect(stakingSection.stakedAmount).toHaveText('3,000');
            });

            await test.step('Wait for transaction confirmation', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '0', // lowered by confirmation
                            pendingDepositedBalance: '100204158497493752', // increased by confirmation
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '7000000000000000000000',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await expect(stakingSection.transactionStatus).toHaveText('Transaction confirmed');
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
                await expect(stakingSection.pendingAmount).toHaveText('0.100204158497493752');
                await expect(stakingSection.stakedAmount).toHaveText('3,000');
                await expect(stakingSection.pendingTransactionText).toBeHidden();
                await expect(stakingSection.speedUpButton).toBeHidden();
            });

            await test.step('Wait for staking activation', async () => {
                blockbookMock.updateAccountState({
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '0',
                            pendingDepositedBalance: '0', // lowered by activation
                            depositedBalance: '3000100204158497493752', // increased by activation
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '7000000000000000000000',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await expect(stakingSection.pendingAmount).toBeHidden();
                await expect(stakingSection.stakedAmount).toHaveText('3,000.100204158497493752');
                await stakingSection.expectProgressIndicatorsToMatchPhase('receivingRewards');
            });

            await test.step('Verify banner about instant staking', async () => {
                await expect(stakingSection.instantBannerHeader).toHaveText(
                    '0.100204158497493752 ETH staked instantly!',
                );
                await expect(stakingSection.instantBannerParagraph).toHaveText(
                    "You've instantly staked 0.100204158497493752 ETH. The remaining ETH will be staked within 1 day.",
                );
                await stakingSection.instantBannerGotItButton.click();
                await expect(stakingSection.instantBanner).toBeHidden();
            });
        },
    );
});
