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

test.describe('TRX voting', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
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
        'User can move TRX votes to another representative',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user with frozen TRX can move all votes from one Super Representative to another.',
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async ({ walletPage, stakingSection, tronStakingPage, devicePrompt, tronStakingMock }) => {
            const { luganodes, p2pOrg } = TRON_REPRESENTATIVES;

            await test.step('Open the Tron vote flow', async () => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('trx'),
                    type: 'normal',
                    atIndex: 0,
                });
                await stakingSection.stakingTabButton.click();
                await tronStakingPage.stakedCardVoteButton.click();
                await expect(tronStakingPage.allocationRowVotes(luganodes.address)).toHaveText(
                    String(STAKED_AMOUNT),
                );
            });

            await test.step('Move votes and confirm on device', async () => {
                await tronStakingPage.changeRepresentativesButton.click();
                await tronStakingPage.toggleRepresentatives([luganodes.address, p2pOrg.address]);
                await expect(tronStakingPage.allocationRowVotes(luganodes.address)).toBeHidden();
                await expect(tronStakingPage.allocationRowVotes(p2pOrg.address)).toHaveText(
                    String(STAKED_AMOUNT),
                );
                await tronStakingPage.voteContinueButton.click();
                await tronStakingPage.acceptVoteConsent();
                await tronStakingPage.confirmVotesOnDevice(STAKED_AMOUNT);
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.vote);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmVote([
                    { address: p2pOrg.address, voteCount: String(STAKED_AMOUNT) },
                ]);
            });

            await test.step('Verify the vote summary', async () => {
                await expect(tronStakingPage.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_VOTE_COMPLETE',
                    { timeout: tronStakingPage.transactionConfirmationTimeout },
                );
                await expect(
                    tronStakingPage.completeVoteAllocationVotes(p2pOrg.address),
                ).toHaveText(String(STAKED_AMOUNT));
                expect(tronStakingMock.reportedTransactions).toEqual([
                    {
                        txid: expect.stringMatching(/^[0-9a-f]{64}$/),
                        network: 'tron',
                        kind: 'vote',
                    },
                ]);
            });
        },
    );
});
