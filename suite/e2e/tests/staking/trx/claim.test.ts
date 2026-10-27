import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import {
    TRON_REPRESENTATIVES,
    TRON_STAKING_TXIDS,
    trxToSun,
} from '../../../support/mocks/tronStakingMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const STAKED_AMOUNT = 100;
const REWARD_AMOUNT = 2.5;

test.describe('TRX staking rewards', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, tronStakingMock }) => {
        await onboardingPage.completeOnboarding();
        tronStakingMock.setStakingInfo({
            stakedBalance: trxToSun(STAKED_AMOUNT),
            stakedBalanceBandwidth: trxToSun(STAKED_AMOUNT),
            totalVotingPower: String(STAKED_AMOUNT),
            availableVotingPower: '0',
            votes: [
                {
                    address: TRON_REPRESENTATIVES.luganodes.address,
                    voteCount: String(STAKED_AMOUNT),
                },
            ],
            unclaimedReward: trxToSun(REWARD_AMOUNT),
        });
        await settingsPage.changeNetworks({
            enableNetworks: [
                {
                    symbol: asNetworkSymbol('trx'),
                    backend: { type: 'blockbook', url: tronStakingMock.url },
                },
            ],
        });
    });

    test(
        'User can claim TRX voting rewards',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can claim the voting rewards earned by votes for a Super Representative.',
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async ({ walletPage, stakingSection, tronStakingPage, devicePrompt, tronStakingMock }) => {
            await test.step('Open the Tron claim flow', async () => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('trx'),
                    type: 'normal',
                    atIndex: 0,
                });
                await stakingSection.stakingTabButton.click();
                await expect(tronStakingPage.rewardsCardAmount).toHaveText(`${REWARD_AMOUNT} TRX`);
                await tronStakingPage.rewardsCardClaimButton.click();
                await expect(tronStakingPage.claimTitle).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_TITLE',
                );
                await expect(tronStakingPage.claimAmount).toHaveText(`${REWARD_AMOUNT} TRX`);
            });

            await test.step('Claim rewards and confirm on device', async () => {
                await tronStakingPage.claimContinueButton.click();
                await tronStakingPage.confirmClaimOnDevice('votingRewards');
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.claim);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmClaim();
            });

            await test.step('Verify the claim summary', async () => {
                await expect(tronStakingPage.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_COMPLETE',
                    { timeout: tronStakingPage.transactionConfirmationTimeout },
                );
                await expect(tronStakingPage.completeClaimedAmount).toHaveText(
                    `${REWARD_AMOUNT} TRX`,
                );
            });
        },
    );
});
