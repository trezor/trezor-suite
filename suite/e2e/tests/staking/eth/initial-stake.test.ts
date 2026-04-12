import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../../fixtures/staking/eth-stake-confirmed-tx.json';
import ETH_STAKE_PENDING_TX from '../../../fixtures/staking/eth-stake-pending-tx.json';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('ETH staking', { tag: ['@T3W1', '@T3T1'] }, () => {
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
            // Set initial empty state for ETH account
            blockbookMock.updateAccountState({
                txs: 0,
                nonTokenTxs: 0,
                internalTxs: 0,
                transactions: [],
                nonce: '0',
                stakingPools: [
                    {
                        contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                        name: 'Everstake',
                        pendingBalance: '0',
                        pendingDepositedBalance: '0',
                        depositedBalance: '0',
                        withdrawTotalAmount: '0',
                        claimableAmount: '0',
                        restakedReward: '0',
                        autocompoundBalance: '0',
                    },
                ],
            });

            await settingsPage.coinsTab.disableNetwork('btc');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'first stake on ETH account',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can do first stake from his clean Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, device, walletPage, stakingSection, devicePrompt, blockbookMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.stakingDashboardCard).toBeHidden();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.startStakingButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKING_IN_A_NUTSHELL');
                await stakingSection.continueButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKE_TOKEN', {
                    values: { symbol: 'ETH' },
                });
                await stakingSection.everstakeAcknowledgeCheckbox.click();
                await stakingSection.confirmButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('1,234 ETH');
                await stakingSection.cryptoInput.fill('0.100204158497493752');
            });

            await test.step('Initiate staking and confirm on device', async () => {
                await stakingSection.continueButton.click();
                await stakingSection.acknowledgeCheckbox.click();
                await stakingSection.confirmAndStakeButton.click();

                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_STAKE_ON_EVERSTAKE',
                    { values: { symbol: 'ETH' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [['Stake ETH on', '\n', 'Everstake?']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    '0.100204158497493752 ETH',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.000290278609719 ETH',
                );

                const amountWrapped = device.wrapText('0.100204158497493752 ETH', {
                    isAmount: true,
                });
                const feeMaxWrapped = device.wrapText('0.000290278609719 ETH', {
                    isAmount: true,
                });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [['Amount'], amountWrapped, ['Maximum fee'], feeMaxWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                blockbookMock.updateAccountState({
                    balance: '1233899795841502506248', // lowered by staked amount
                    transactions: [ETH_STAKE_PENDING_TX],
                    unconfirmedTxs: 1,
                    txs: 1,
                    nonTokenTxs: 1,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '100204158497493752', // increased by staked amount
                            pendingDepositedBalance: '0',
                            depositedBalance: '0',
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '0',
                            autocompoundBalance: '0',
                        },
                    ],
                    nonce: '2',
                });
                await devicePrompt.sendButton.click();
                await expect(stakingSection.stakedToastAccount).toContainText('Ethereum #1');
                await expect(stakingSection.stakedToastAmount).toContainText(
                    '0.100204158497493752 ETH',
                );
            });

            await test.step('Verify pending transaction', async () => {
                await expect(stakingSection.pendingTransactionText).toBeVisible();
                await expect(stakingSection.transactionStatus).toHaveTranslation(
                    'TR_TX_CONFIRMING',
                );
                await stakingSection.expectProgressIndicatorsToMatchPhase('pendingTransaction');
                await expect(stakingSection.speedUpButton).toBeEnabled();
                await stakingSection.expectStakingAmounts({
                    pending: '0.100204158497493752',
                    staked: '0',
                    rewards: '0',
                    unstaking: 'hidden',
                });
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
                            depositedBalance: '0',
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '0',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await expect(stakingSection.transactionStatus).toHaveTranslation('TR_TX_CONFIRMED');
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
                await stakingSection.expectStakingAmounts({
                    pending: '0.100204158497493752',
                    staked: '0',
                    rewards: '0',
                    unstaking: 'hidden',
                });
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
                            depositedBalance: '100204158497493752', // increased by activation
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '0',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '0.100204158497493752',
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await stakingSection.expectProgressIndicatorsToMatchPhase('receivingRewards');
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
            });
        },
    );
});
