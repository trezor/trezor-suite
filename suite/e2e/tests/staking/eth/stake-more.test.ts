import type { EthValidatorsQueue, StakingBatch } from '@suite-common/earn-staking-api';
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
            await page.context().route('**/staking/v1**', async route => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    json: {
                        data: [
                            {
                                symbol: 'eth',
                                stats: {
                                    apy: 1,
                                    nextRewardPayout: 1,
                                },
                                validators: {
                                    activationTime: 0,
                                    addingDelay: 60 * 60 * 24,
                                },
                            },
                        ],
                        errors: [],
                    } satisfies StakingBatch,
                });
            });

            await page.context().route('**/eth/validators-queue**', async route => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    json: {
                        activationTime: 0,
                        addingDelay: 60 * 60 * 24,
                    } satisfies EthValidatorsQueue,
                });
            });

            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coinsTab.enableNetwork('eth');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);

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
                        withdrawTotalAmount: '0',
                        claimableAmount: '0',
                        restakedReward: '234000000000000000000',
                        autocompoundBalance: '3234000000000000000000',
                    },
                ],
            });
        },
    );

    test(
        'stake on ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake more from his Ethereum account.',
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
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: 'hidden',
                });
                // TODO: Highly unstable. Disappears after first sync of data. Needs investigation.
                // await stakingSection.expectProgressIndicatorsToMatchPhase('receivingRewards');
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.stakeMoreButton.click();
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

                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [
                            ['Amount'],
                            device.wrapText('0.100204158497493752 ETH', { isAmount: true }),
                            ['Maximum fee'],
                            device.wrapText('0.000290278609719 ETH', { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
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
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '3234000000000000000000',
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
                    staked: '3,000',
                    rewards: '234',
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
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '3234000000000000000000',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await expect(stakingSection.transactionStatus).toHaveTranslation('TR_TX_CONFIRMED');
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
                await stakingSection.expectStakingAmounts({
                    pending: '0.100204158497493752',
                    staked: '3,000',
                    rewards: '234',
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
                            depositedBalance: '3000100204158497493752', // increased by activation
                            withdrawTotalAmount: '0',
                            claimableAmount: '0',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '3234000000000000000000',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '3,000.100204158497493752',
                    rewards: '234',
                    unstaking: 'hidden',
                });
                await stakingSection.expectProgressIndicatorsToMatchPhase('receivingRewards');
            });

            await test.step('Verify banner about instant staking', async () => {
                await expect(stakingSection.instantBannerHeader).toHaveTranslation(
                    'TR_EARN_AMOUNT_STAKED_INSTANTLY',
                    {
                        values: { amount: '0.100204158497493752', symbol: 'ETH' },
                    },
                );
                await expect(stakingSection.instantBannerParagraph).toHaveTranslation(
                    'TR_EARN_INSTANTLY_STAKED',
                    {
                        values: { amount: '0.100204158497493752', symbol: 'ETH', days: '1' },
                    },
                );
                await stakingSection.instantBannerGotItButton.click();
                await expect(stakingSection.instantBanner).toBeHidden();
            });
        },
    );
});
