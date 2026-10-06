import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { BigNumber, localizeNumber } from '@trezor/utils';

import {
    rewards,
    solStakingAccountDeactivating,
    solStakingAccountFirst,
    solStakingAccountSecond,
    totalReward,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const solSymbol = asNetworkSymbol('sol');

// Expected values based on our mocked responses
const firstStakedAmount = solStakingAccountFirst.stakeInSol;
const secondStakedAmount = solStakingAccountSecond.stakeInSol;
const stakedTotal = (Number(firstStakedAmount) + Number(secondStakedAmount)).toFixed(9);
const unstakingTotal = solStakingAccountDeactivating.stakeInSol;
const stakingAccountTotal = new BigNumber(
    Number(firstStakedAmount) + Number(secondStakedAmount) + Number(unstakingTotal),
);
// An account balance is compact: two decimals from 1 upwards, and no ellipsis.
const stakingAccountTotalFormatted = `${localizeNumber(
    stakingAccountTotal.decimalPlaces(2, BigNumber.ROUND_DOWN),
    'en-US',
    2,
    2,
)} SOL`;
const totalRewardsInSol = (Number(totalReward.response.total) / 1_000_000_000).toFixed(9);
const activeEpoch = solStakingAccountDeactivating.deactivationEpoch;
// Rewards history before and after the reward for the previous epoch is published
const rewardsUntilTwoEpochsAgo = rewards.response.rewards.filter(
    reward => reward.epoch <= activeEpoch - 2,
);
const rewardsUntilPreviousEpoch = rewards.response.rewards.filter(
    reward => reward.epoch <= activeEpoch - 1,
);

test.describe('sol staking', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        solanaStakingMock.setStakeAccounts([
            solStakingAccountFirst.payload,
            solStakingAccountSecond.payload,
            solStakingAccountDeactivating.payload,
        ]);
        await solanaStakingMock.setEpoch(activeEpoch);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: solSymbol, backend: { type: 'solana', url: solanaStakingMock.url } },
            ],
        });

        // Rewards history has to be mocked before the account opens
        solanaStakingMock.setRewardsHistory(rewardsUntilTwoEpochsAgo);
        await solanaStakingMock.mockRewardsHistory();
    });

    test(
        'display stake rewards on SOL staking account',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user see rewards on his Solana staking account and is warned only while the latest reward may be missing in rewards history.',
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Earn,
            }),
        },
        async ({ page, walletPage, tradingPage, stakingSection, solanaStakingMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: solSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: stakedTotal,
                        rewards: '0',
                        unstaking: unstakingTotal,
                    },
                });

                await expect(
                    walletPage.balanceOfAccountWithSymbol({
                        symbol: solSymbol,
                        subAccount: 'staking',
                    }),
                ).toHaveText(stakingAccountTotalFormatted);
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
            });

            await test.step('Mock total rewards and expire the rewards query cache', async () => {
                await solanaStakingMock.mockTotalRewards();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
            });

            await test.step('Switch to Overview tab and back to trigger rewards update', async () => {
                await walletPage.overviewTabButton.click();
                // We need to give Suite time to load new tab or rewards request won't be triggered
                await expect(tradingPage.buyButton).toBeVisible();
                await stakingSection.stakingTabButton.click();
            });

            await test.step('Verify rewards are displayed correctly', async () => {
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: stakedTotal,
                        rewards: totalRewardsInSol,
                        unstaking: unstakingTotal,
                    },
                });
                await expect(
                    walletPage.balanceOfAccountWithSymbol({
                        symbol: solSymbol,
                        subAccount: 'staking',
                    }),
                ).toHaveText(stakingAccountTotalFormatted);

                // The reward for the previous epoch is not in rewards history yet
                await expect(stakingSection.rewardsWarningBanner).toHaveTranslation(
                    'TR_SOL_STAKING_REWARD_WARNING',
                );
                await stakingSection.rewardList.checkRewards(rewardsUntilTwoEpochsAgo);
            });

            await test.step('Publish the reward for the previous epoch in rewards history', async () => {
                solanaStakingMock.setRewardsHistory(rewardsUntilPreviousEpoch);
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                // Rewards history is refetched only when the Staking tab opens again, so we leave it.
                // The Buy button shows the Overview tab loaded, otherwise the switch back may not reopen it.
                await walletPage.overviewTabButton.click();
                await expect(tradingPage.buyButton).toBeVisible();
            });

            await test.step('Verify rewards warning is hidden', async () => {
                const rewardsRefetched = page.waitForResponse(rewards.url);
                await stakingSection.stakingTabButton.click();
                await rewardsRefetched;
                await expect(stakingSection.rewardList.latestRewardEpoch).toHaveTranslation(
                    'TR_STAKE_REWARDS_BADGE',
                    { values: { count: activeEpoch - 1 } },
                );
                await expect(stakingSection.rewardsWarningBanner).toBeHidden();
            });
        },
    );
});
