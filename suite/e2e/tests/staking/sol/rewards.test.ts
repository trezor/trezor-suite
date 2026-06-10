import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import {
    rewards,
    solStakingAccountDeactivating,
    solStakingAccountFirst,
    solStakingAccountSecond,
    totalReward,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Expected values based on our mocked responses
const firstStakedAmount = solStakingAccountFirst.stakeInSol;
const secondStakedAmount = solStakingAccountSecond.stakeInSol;
const stakedTotal = (Number(firstStakedAmount) + Number(secondStakedAmount)).toFixed(9);
const unstakingTotal = solStakingAccountDeactivating.stakeInSol;
const stakingAccountTotal = new BigNumber(
    Number(firstStakedAmount) + Number(secondStakedAmount) + Number(unstakingTotal),
).decimalPlaces(8, BigNumber.ROUND_DOWN);
const stakingAccountTotalFormatted = `${stakingAccountTotal}… SOL`;
const totalRewardsInSol = (Number(totalReward.response.total) / 1_000_000_000).toFixed(9);

test.describe('sol staking', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await solanaStakingMock.setProgramAccounts([
            solStakingAccountFirst.payload,
            solStakingAccountSecond.payload,
            solStakingAccountDeactivating.payload,
        ]);
        await solanaStakingMock.setEpoch(solStakingAccountDeactivating.deactivationEpoch);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
    });

    test(
        'display stake rewards on SOL staking account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user see rewards on his Solana staking account.',
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, tradingPage, stakingSection, solanaStakingMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: stakedTotal,
                    rewards: '0',
                    unstaking: unstakingTotal,
                });

                await expect(
                    walletPage.balanceOfAccountWithSymbol({
                        symbol: 'sol',
                        subAccount: 'staking',
                    }),
                ).toHaveText(stakingAccountTotalFormatted);
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
            });

            await test.step('Mock rewards and advance epoch', async () => {
                await page.route(rewards.url, async route => {
                    const url = new URL(route.request().url());
                    const limit = Number(url.searchParams.get('limit') ?? 10);
                    const offset = Number(url.searchParams.get('offset') ?? 0);
                    const allRewards = rewards.response.rewards;

                    await route.fulfill({
                        json: {
                            rewards: allRewards.slice(offset, offset + limit),
                            totalCount: allRewards.length,
                        },
                    });
                });
                await page.route(totalReward.url, async route => {
                    await route.fulfill({ json: totalReward.response });
                });
                await solanaStakingMock.advanceEpoch();
                // Advance the fake clock past staleTime (1h) so the rewards cache is stale
                // when the component remounts. The mocked fetch completes after fastForward
                // returns (during the first await in the next step), at which point
                // Date.now() = T0+2h, so dataUpdatedAt = T0+2h. A second fastForward in the
                // next step advances Date.now() to T0+4h so that on remount
                // Date.now() - dataUpdatedAt = 2h > staleTime(1h) and React Query re-runs
                // queryFn, calling onTotalCount to restore pagination state.
                await page.clock.fastForward('02:00:00');
            });

            await test.step('Switch to Overview tab and back to trigger rewards update', async () => {
                await walletPage.overviewTabButton.click();
                // We need to give Suite time to load new tab or rewards request won't be triggered
                await expect(tradingPage.buyButton).toBeVisible();
                // The async rewards fetch (triggered by fastForward in the previous step) completes
                // during the first await above, setting dataUpdatedAt = T0+2h (= fake clock at that
                // moment). We must advance the clock a second time so that at SolStakingDashboard
                // remount Date.now() - dataUpdatedAt > staleTime(1h), forcing React Query to re-run
                // queryFn, which calls onTotalCount(totalCount) and restores pagination state.
                await page.clock.fastForward('02:00:00');
                await stakingSection.stakingTabButton.click();
            });

            await test.step('Verify rewards are displayed correctly', async () => {
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: stakedTotal,
                    rewards: totalRewardsInSol,
                    unstaking: unstakingTotal,
                });
                await expect(
                    walletPage.balanceOfAccountWithSymbol({
                        symbol: 'sol',
                        subAccount: 'staking',
                    }),
                ).toHaveText(stakingAccountTotalFormatted);

                await stakingSection.rewardList.checkRewards(rewards.response.rewards);
            });
        },
    );
});
