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
