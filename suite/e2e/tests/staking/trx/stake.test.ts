import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { TRON_MOCKED_ADDRESS } from '../../../support/mocks/tron-endpoints';
import { TRON_REPRESENTATIVES, TRON_STAKING_TXIDS } from '../../../support/mocks/tronStakingMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const FREEZE_AMOUNT = 100;

test.describe('TRX staking', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, tronStakingMock }) => {
        await onboardingPage.completeOnboarding();
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
        'User can stake TRX by freezing it and voting for a representative',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can freeze TRX and vote for a Super Representative from a clean Tron account.',
                category: TestCategory.Staking,
                priority: TestPriority.Critical,
                stream: TestStream.Earn,
            }),
        },
        async ({
            walletPage,
            stakingSection,
            earnNutshellModal,
            tronStakingPage,
            devicePrompt,
            tronStakingMock,
        }) => {
            const { luganodes } = TRON_REPRESENTATIVES;

            await test.step('Open the Tron staking flow', async () => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('trx'),
                    type: 'normal',
                    atIndex: 0,
                });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await stakingSection.startStakingButton.click();
                await earnNutshellModal.continueButton.click();
                await tronStakingPage.acceptStakeConsent();
                await expect(tronStakingPage.stakeTitle).toHaveTranslation(
                    'TR_EARN_TRON_STAKE_TITLE',
                );
            });

            await test.step('Freeze TRX and confirm on device', async () => {
                await tronStakingPage.freezeAmountInput.fill(String(FREEZE_AMOUNT));
                await tronStakingPage.freezeContinueButton.click();
                await tronStakingPage.confirmResourceOperationOnDevice({
                    ownerAddress: TRON_MOCKED_ADDRESS,
                    amount: FREEZE_AMOUNT,
                    resource: 'bandwidth',
                });
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.freeze);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmFreeze({ amount: FREEZE_AMOUNT, resource: 'bandwidth' });
                await expect(tronStakingPage.selectRepresentativesButton).toBeVisible({
                    timeout: tronStakingPage.transactionConfirmationTimeout,
                });
            });

            await test.step('Vote for a representative and confirm on device', async () => {
                await tronStakingPage.selectRepresentativesButton.click();
                await tronStakingPage.toggleRepresentatives([luganodes.address]);
                await expect(tronStakingPage.allocationRowVotes(luganodes.address)).toHaveText(
                    String(FREEZE_AMOUNT),
                );
                await tronStakingPage.voteContinueButton.click();
                await tronStakingPage.acceptVoteConsent();
                await tronStakingPage.confirmVotesOnDevice(FREEZE_AMOUNT);
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.vote);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmVote([
                    { address: luganodes.address, voteCount: String(FREEZE_AMOUNT) },
                ]);
            });

            await test.step('Verify the stake summary', async () => {
                await expect(tronStakingPage.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_STAKE_COMPLETE',
                    { timeout: tronStakingPage.transactionConfirmationTimeout },
                );
                await expect(tronStakingPage.completeSuppliedAmount).toHaveText(
                    `${FREEZE_AMOUNT} TRX`,
                );
                await expect(
                    tronStakingPage.completeVoteAllocationVotes(luganodes.address),
                ).toHaveTranslation('TR_TRON_TX_VOTED_VOTES', {
                    values: { votes: FREEZE_AMOUNT },
                });
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
