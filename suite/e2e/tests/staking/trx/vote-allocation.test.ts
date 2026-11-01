import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import {
    buildTrxRevotedAccountState,
    buildTrxVotedAccountState,
} from '../../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { TRON_LUGANODES_ADDRESS, TRON_P2P_ADDRESS } from '../../../support/mocks/tronEarnApiMock';
import { TRX_BEST_BLOCK } from '../../../support/mocks/trx-endpoints';

const trxSymbol = asNetworkSymbol('trx');

const STAKE_AMOUNT = '100';
const STAKE_AMOUNT_SUN = '100000000';
const STAKE_AMOUNT_FORMATTED = `${STAKE_AMOUNT} TRX`;
const ALL_VOTES_ASSIGNED = `${STAKE_AMOUNT}/${STAKE_AMOUNT}`;
const KEPT_VOTES = '60';
const MOVED_VOTES = '40';
const OVER_ALLOCATED_VOTES = '41';
// Txids of the transactions already in the mocked history when the test starts.
const FREEZE_TXID = '0e47dc1def1a4c96e23e298ca2af8a1d6ab58747b6c830505d2d0a9505c832b0';
const VOTE_TXID = 'b4b7e9a522e5cc2d728fb003bd72abd07f316e1eecdb26c59b016776e4cb2c02';

const votedAccount = {
    stakeAmount: STAKE_AMOUNT,
    stakeAmountSun: STAKE_AMOUNT_SUN,
    freezeTxid: FREEZE_TXID,
    voteTxid: VOTE_TXID,
    representativeAddress: TRON_LUGANODES_ADDRESS,
};

test.describe('Staking - Tron', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Enable Tron with an account voting for one representative', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('trx');
            blockbookMock.updateAccountState(buildTrxVotedAccountState(votedAccount));
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: trxSymbol, backend: { type: 'blockbook', url: blockbookMock.url } },
                ],
            });
        });
    });

    test(
        'Split Tron votes between two representatives',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can move part of the votes to a second representative and cannot assign more votes than the staked amount allows.',
                category: TestCategory.Staking,
                priority: TestPriority.Critical,
                stream: TestStream.Earn,
            }),
        },
        async ({
            device,
            devicePrompt,
            walletPage,
            stakingSection,
            tronStakingSection,
            blockbookMock,
            tronEarnApiMock,
        }) => {
            const luganodes = tronEarnApiMock.representatives.find(
                ({ address }) => address === TRON_LUGANODES_ADDRESS,
            );
            const p2p = tronEarnApiMock.representatives.find(
                ({ address }) => address === TRON_P2P_ADDRESS,
            );

            await test.step('Verify the current vote allocation on the dashboard', async () => {
                await walletPage.openAccount({ symbol: trxSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(tronStakingSection.stakedAmount).toHaveText(STAKE_AMOUNT_FORMATTED);
                await expect(tronStakingSection.stakedCardAprValue).toHaveText(
                    `${luganodes?.apr}%`,
                );
                await expect(tronStakingSection.votesToAllocateButton).toBeHidden();
                await expect(tronStakingSection.remainingVotesButton).toHaveTranslation(
                    'TR_EARN_TRON_REMAINING_VOTES',
                    { values: { remaining: 0, total: Number(STAKE_AMOUNT) } },
                );

                await tronStakingSection.remainingVotesButton.click();
                await expect(tronStakingSection.voteAllocationAssignedVotes).toHaveText(
                    ALL_VOTES_ASSIGNED,
                );
                await expect(
                    tronStakingSection.voteAllocationRowName(TRON_LUGANODES_ADDRESS),
                ).toHaveText(luganodes?.name ?? '');
                await expect(
                    tronStakingSection.voteAllocationRowVotes(TRON_LUGANODES_ADDRESS),
                ).toHaveText(STAKE_AMOUNT);
                await expect(
                    tronStakingSection.voteAllocationRowApr(TRON_LUGANODES_ADDRESS),
                ).toHaveText(`${luganodes?.apr}%`);
                await expect(tronStakingSection.voteAllocationRow(TRON_P2P_ADDRESS)).toBeHidden();
            });

            await test.step('Open the vote flow from the allocation modal', async () => {
                await tronStakingSection.voteAllocationChangeVotesButton.click();
                await expect(tronStakingSection.voteAllocationModal).toBeHidden();
                await expect(tronStakingSection.voteTitle).toHaveTranslation(
                    'TR_EARN_TRON_CHANGE_REPRESENTATIVE',
                );
                await expect(tronStakingSection.remainingVotes).toHaveTranslation(
                    'TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL',
                    { values: { remaining: '0', total: STAKE_AMOUNT } },
                );
                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_LUGANODES_ADDRESS),
                ).toHaveText(STAKE_AMOUNT);
                await expect(tronStakingSection.allocationRow(TRON_P2P_ADDRESS)).toBeHidden();
            });

            await test.step('Add a second representative', async () => {
                await tronStakingSection.changeRepresentativesButton.click();
                await expect(tronStakingSection.selectRepresentativesHeading).toHaveTranslation(
                    'TR_EARN_TRON_SELECT_REPRESENTATIVES',
                );
                await expect(
                    tronStakingSection.representativeCheckboxInput(TRON_LUGANODES_ADDRESS),
                ).toBeChecked();
                await expect(
                    tronStakingSection.representativeCheckboxInput(TRON_P2P_ADDRESS),
                ).not.toBeChecked();

                await tronStakingSection.representativeCheckbox(TRON_P2P_ADDRESS).click();
                await tronStakingSection.selectRepresentativesConfirmButton.click();
                await expect(tronStakingSection.selectRepresentativesModal).toBeHidden();

                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_LUGANODES_ADDRESS),
                ).toHaveText(STAKE_AMOUNT);
                await expect(tronStakingSection.allocationRowName(TRON_P2P_ADDRESS)).toHaveText(
                    p2p?.name ?? '',
                );
                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_P2P_ADDRESS),
                ).toHaveText('0');
                await expect(tronStakingSection.allocationRowApr(TRON_P2P_ADDRESS)).toHaveText(
                    `${p2p?.apr}%`,
                );
                await expect(tronStakingSection.votesToAllocateBanner).toBeHidden();
            });

            await test.step('Reject an allocation above the total votes', async () => {
                await tronStakingSection.allocationRowVotesButton(TRON_P2P_ADDRESS).click();
                await expect(tronStakingSection.reassignVotesHeading).toHaveTranslation(
                    'TR_EARN_TRON_REASSIGN_VOTES',
                );
                await expect(tronStakingSection.reassignVotesRemainingVotes).toHaveText(
                    `0 / ${STAKE_AMOUNT}`,
                );

                await tronStakingSection
                    .reassignVotesInput(TRON_LUGANODES_ADDRESS)
                    .fill(KEPT_VOTES);
                await expect(tronStakingSection.reassignVotesRemainingVotes).toHaveText(
                    `${MOVED_VOTES} / ${STAKE_AMOUNT}`,
                );
                await expect(tronStakingSection.reassignVotesExceedBanner).toBeHidden();

                await tronStakingSection
                    .reassignVotesInput(TRON_P2P_ADDRESS)
                    .fill(OVER_ALLOCATED_VOTES);
                await expect(tronStakingSection.reassignVotesExceedBanner).toHaveTranslation(
                    'TR_EARN_TRON_VOTES_EXCEED_TOTAL',
                    { values: { total: Number(STAKE_AMOUNT) } },
                );
                await expect(tronStakingSection.reassignVotesRemainingVotes).toHaveText(
                    `0 / ${STAKE_AMOUNT}`,
                );
                await expect(tronStakingSection.reassignVotesConfirmButton).toBeDisabled();
            });

            await test.step('Move part of the votes to the new representative', async () => {
                await tronStakingSection.reassignVotesInput(TRON_P2P_ADDRESS).fill(MOVED_VOTES);
                await expect(tronStakingSection.reassignVotesExceedBanner).toBeHidden();
                await expect(tronStakingSection.reassignVotesRemainingVotes).toHaveText(
                    `0 / ${STAKE_AMOUNT}`,
                );
                await tronStakingSection.reassignVotesConfirmButton.click();
                await expect(tronStakingSection.reassignVotesModal).toBeHidden();

                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_LUGANODES_ADDRESS),
                ).toHaveText(KEPT_VOTES);
                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_P2P_ADDRESS),
                ).toHaveText(MOVED_VOTES);
                await expect(tronStakingSection.remainingVotes).toHaveTranslation(
                    'TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL',
                    { values: { remaining: '0', total: STAKE_AMOUNT } },
                );
                await expect(tronStakingSection.votesToAllocateBanner).toBeHidden();
                await tronStakingSection.voteContinueButton.click();
            });

            await test.step('Accept the terms of the new representative', async () => {
                await expect(tronStakingSection.voteConsentHeading).toHaveTranslation(
                    'TR_TRON_VOTE_CONSENT_MODAL_HEADING',
                    { values: { representativeName: p2p?.name ?? '' } },
                );
                await expect(tronStakingSection.voteConsentConfirmButton).toBeDisabled();
                await tronStakingSection.voteConsentCheckbox.click();
                await tronStakingSection.voteConsentConfirmButton.click();
                await expect(tronStakingSection.voteConsentModal).toBeHidden();
            });

            await test.step('Confirm the vote on device and broadcast', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Review' },
                        body: [
                            ['Address'],
                            device.wrapText(TRON_LUGANODES_ADDRESS),
                            ['\n', 'Votes'],
                            [KEPT_VOTES],
                        ],
                        actions: { right_button: 'Hold to confirm' },
                    },
                    T3T1: {
                        header: { title: 'Review', subtitle: 'Voting' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(tronStakingSection.reviewOutputVoteAddress(0)).toHaveText(
                    TRON_LUGANODES_ADDRESS,
                );
                await expect(tronStakingSection.reviewOutputVoteCount(0)).toHaveText(KEPT_VOTES);
                await expect(tronStakingSection.reviewOutputVoteAddress(1)).toHaveText(
                    TRON_P2P_ADDRESS,
                );
                await expect(tronStakingSection.reviewOutputVoteCount(1)).toHaveText(MOVED_VOTES);
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_VOTE',
                );
                await expect(tronStakingSection.toastMessage('tx-voted')).toHaveTranslation(
                    'TOAST_TX_VOTE_PENDING',
                );
                await tronStakingSection.dismissToast('tx-voted');
                expect(tronEarnApiMock.reportedTxIds).toEqual([
                    { txid: blockbookMock.lastBroadcastTxid, network: 'tron', kind: 'vote' },
                ]);
            });

            await test.step('Confirm the vote on chain and verify the summary', async () => {
                blockbookMock.updateAccountState(
                    buildTrxRevotedAccountState({
                        ...votedAccount,
                        revoteTxid: blockbookMock.lastBroadcastTxid,
                        newVotes: [
                            { address: TRON_LUGANODES_ADDRESS, count: KEPT_VOTES },
                            { address: TRON_P2P_ADDRESS, count: MOVED_VOTES },
                        ],
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 3,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_VOTE_COMPLETE',
                    { timeout: tronStakingSection.chainConfirmationTimeout },
                );
                await expect(tronStakingSection.completeDescription).toHaveTranslation(
                    'TR_EARN_TRON_VOTE_COMPLETE_DESCRIPTION',
                );
                await expect(tronStakingSection.toastMessage('tx-voted')).toHaveTranslation(
                    'TOAST_TX_VOTE_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-voted');
                await expect(
                    tronStakingSection.summaryVoteAllocationRowName(TRON_LUGANODES_ADDRESS),
                ).toHaveText(luganodes?.name ?? '');
                await expect(
                    tronStakingSection.summaryVoteAllocationRowVotes(TRON_LUGANODES_ADDRESS),
                ).toHaveText(KEPT_VOTES);
                await expect(
                    tronStakingSection.summaryVoteAllocationRowName(TRON_P2P_ADDRESS),
                ).toHaveText(p2p?.name ?? '');
                await expect(
                    tronStakingSection.summaryVoteAllocationRowVotes(TRON_P2P_ADDRESS),
                ).toHaveText(MOVED_VOTES);
            });

            await test.step('Verify the dashboard reflects both representatives', async () => {
                await tronStakingSection.backToOverviewButton.click();
                await expect(tronStakingSection.stakedAmount).toHaveText(STAKE_AMOUNT_FORMATTED);
                await expect(tronStakingSection.stakedCardAprValue).toHaveText(
                    `${luganodes?.apr}%`,
                );
                await expect(tronStakingSection.votesToAllocateButton).toBeHidden();

                await tronStakingSection.remainingVotesButton.click();
                await expect(tronStakingSection.voteAllocationAssignedVotes).toHaveText(
                    ALL_VOTES_ASSIGNED,
                );
                await expect(
                    tronStakingSection.voteAllocationRowVotes(TRON_LUGANODES_ADDRESS),
                ).toHaveText(KEPT_VOTES);
                await expect(tronStakingSection.voteAllocationRowName(TRON_P2P_ADDRESS)).toHaveText(
                    p2p?.name ?? '',
                );
                await expect(
                    tronStakingSection.voteAllocationRowVotes(TRON_P2P_ADDRESS),
                ).toHaveText(MOVED_VOTES);
                await expect(tronStakingSection.voteAllocationRowApr(TRON_P2P_ADDRESS)).toHaveText(
                    `${p2p?.apr}%`,
                );
                await tronStakingSection.voteAllocationCloseButton.click();
                await expect(tronStakingSection.voteAllocationModal).toBeHidden();
            });
        },
    );
});
