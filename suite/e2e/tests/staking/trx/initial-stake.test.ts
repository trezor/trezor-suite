import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import {
    buildTrxFrozenAccountState,
    buildTrxVotedAccountState,
    getTrxBandwidthGain,
} from '../../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { TRON_LUGANODES_ADDRESS } from '../../../support/mocks/tronEarnApiMock';
import { TRX_BEST_BLOCK, TRX_FIRST_ACCOUNT_ADDRESS } from '../../../support/mocks/trx-endpoints';

const trxSymbol = asNetworkSymbol('trx');

const STAKE_AMOUNT = '100';
const STAKE_AMOUNT_SUN = '100000000';
const STAKE_AMOUNT_FORMATTED = `${STAKE_AMOUNT} TRX`;
const BANDWIDTH_GAIN = getTrxBandwidthGain(STAKE_AMOUNT);

test.describe('Staking - Tron', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Enable Tron and set mocked backend', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('trx');
            await settingsPage.changeNetworks({
                enableNetworks: [
                    {
                        symbol: trxSymbol,
                        backend: { type: 'blockbook', url: blockbookMock.url },
                    },
                ],
            });
        });
    });

    test(
        'Stake Tron',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can freeze TRX and vote for a representative from new Tron account.',
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
            earnNutshellModal,
            blockbookMock,
            tronEarnApiMock,
        }) => {
            let freezeTxid: string;

            const luganodes = tronEarnApiMock.representatives.find(
                ({ address }) => address === TRON_LUGANODES_ADDRESS,
            );
            const expectedApr = `${luganodes?.apr}%`;

            await test.step('Verify inactive staking dashboard', async () => {
                await walletPage.openAccount({ symbol: trxSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(tronStakingSection.stakedCard).toBeHidden();
                await expect(tronStakingSection.resourcesCard).toBeHidden();
            });

            await test.step('Open the stake flow', async () => {
                await stakingSection.startStakingButton.click();
                await expect(tronStakingSection.stakeTitle).toHaveTranslation(
                    'TR_EARN_TRON_STAKE_TITLE',
                );
                await expect(tronStakingSection.freezeStep).toBeVisible();
            });

            await test.step('Read how Tron staking works', async () => {
                await tronStakingSection.howItWorksButton.click();
                await expect(earnNutshellModal.heading).toHaveTranslation(
                    'TR_EARN_TRON_STAKING_IN_A_NUTSHELL',
                );
                await earnNutshellModal.continueButton.click();
                await expect(earnNutshellModal.modalContainer).toBeHidden();
            });

            await test.step('Fill the freeze form', async () => {
                await expect(tronStakingSection.freezeAvailableBalance).toContainText('1,000 TRX');
                await tronStakingSection.freezeResourceOption('bandwidth').click();
                await tronStakingSection.freezeAmountInput.fill(STAKE_AMOUNT);
                await expect(tronStakingSection.freezeAmountError).toBeHidden();
                await expect(tronStakingSection.freezeReserveRecommendedBanner).toBeHidden();
                await tronStakingSection.freezeContinueButton.click();
            });

            await test.step('Confirm the freeze on device and broadcast', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [device.wrapText(TRX_FIRST_ACCOUNT_ADDRESS, { lengthOverride: 18 })],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Summary' },
                        body: [['Amount'], [STAKE_AMOUNT_FORMATTED], ['Resource'], ['Bandwidth']],
                        actions: { right_button: 'Hold to confirm' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    STAKE_AMOUNT_FORMATTED,
                );
                await expect(tronStakingSection.reviewResource).toHaveTranslation(
                    'TR_TRON_BANDWIDTH',
                );
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_FREEZE',
                );
                await expect(tronStakingSection.toastMessage('tx-staked')).toHaveTranslation(
                    'TOAST_TX_STAKE_PENDING',
                );
                await tronStakingSection.dismissToast('tx-staked');
            });

            await test.step('Confirm the freeze on chain', async () => {
                freezeTxid = blockbookMock.lastBroadcastTxid;
                blockbookMock.updateAccountState(
                    buildTrxFrozenAccountState({
                        stakeAmount: STAKE_AMOUNT,
                        stakeAmountSun: STAKE_AMOUNT_SUN,
                        freezeTxid,
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 1,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.remainingVotes).toHaveTranslation(
                    'TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL',
                    {
                        values: { remaining: STAKE_AMOUNT, total: STAKE_AMOUNT },
                        timeout: tronStakingSection.chainConfirmationTimeout,
                    },
                );
                await expect(tronStakingSection.toastMessage('tx-staked')).toHaveTranslation(
                    'TOAST_TX_STAKE_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-staked');
            });

            await test.step('Select a representative', async () => {
                await tronStakingSection.selectRepresentativesButton.click();
                await expect(tronStakingSection.selectRepresentativesHeading).toHaveTranslation(
                    'TR_EARN_TRON_SELECT_REPRESENTATIVES',
                );
                await expect(tronStakingSection.selectRepresentativesDescription).toHaveTranslation(
                    'TR_EARN_TRON_SELECT_REPRESENTATIVES_DESCRIPTION',
                );
                for (const { address, name, apr } of tronEarnApiMock.representatives) {
                    await expect(tronStakingSection.representativeName(address)).toHaveText(name);
                    await expect(tronStakingSection.representativeAddress(address)).toHaveText(
                        address,
                    );
                    await expect(tronStakingSection.representativeApr(address)).toHaveText(
                        `${apr}%`,
                    );
                }
                await tronStakingSection.representativeCheckbox(TRON_LUGANODES_ADDRESS).click();
                await tronStakingSection.selectRepresentativesConfirmButton.click();
                await expect(
                    tronStakingSection.allocationRowVotesButton(TRON_LUGANODES_ADDRESS),
                ).toHaveText(STAKE_AMOUNT);
                await expect(tronStakingSection.remainingVotes).toHaveTranslation(
                    'TR_EARN_TRON_REMAINING_VOTES_OF_TOTAL',
                    { values: { remaining: '0', total: STAKE_AMOUNT } },
                );
                await expect(tronStakingSection.votesToAllocateBanner).toBeHidden();
                await tronStakingSection.voteContinueButton.click();
            });

            await test.step('Accept the representative terms', async () => {
                await expect(tronStakingSection.voteConsentModal).toBeVisible();
                await tronStakingSection.voteConsentCheckbox.click();
                await tronStakingSection.voteConsentConfirmButton.click();
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
                            [STAKE_AMOUNT],
                        ],
                        actions: { right_button: 'Hold to confirm' },
                    },
                    T3T1: {
                        header: { title: 'Review', subtitle: 'Voting' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(tronStakingSection.reviewVoteAddress).toHaveText(
                    TRON_LUGANODES_ADDRESS,
                );
                await expect(tronStakingSection.reviewVoteCount).toHaveText(STAKE_AMOUNT);
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_VOTE',
                );
                await expect(tronStakingSection.toastMessage('tx-staked')).toHaveTranslation(
                    'TOAST_TX_STAKE_PENDING',
                );
                await tronStakingSection.dismissToast('tx-staked');
                expect(tronEarnApiMock.reportedTxIds).toEqual([
                    { txid: blockbookMock.lastBroadcastTxid, network: 'tron', kind: 'vote' },
                ]);
            });

            await test.step('Confirm the vote on chain and verify the summary', async () => {
                blockbookMock.updateAccountState(
                    buildTrxVotedAccountState({
                        stakeAmount: STAKE_AMOUNT,
                        stakeAmountSun: STAKE_AMOUNT_SUN,
                        freezeTxid,
                        voteTxid: blockbookMock.lastBroadcastTxid,
                        representativeAddress: TRON_LUGANODES_ADDRESS,
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 2,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_STAKE_COMPLETE',
                    { timeout: tronStakingSection.chainConfirmationTimeout },
                );
                await expect(tronStakingSection.toastMessage('tx-staked')).toHaveTranslation(
                    'TOAST_TX_STAKE_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-staked');
                await expect(tronStakingSection.summaryApr).toHaveText(expectedApr);
                await expect(tronStakingSection.summarySuppliedAmount).toHaveText(
                    STAKE_AMOUNT_FORMATTED,
                );
                await expect(tronStakingSection.summaryEarnedResource).toHaveTranslation(
                    'TR_EARN_TRON_BANDWIDTH',
                    { values: { count: BANDWIDTH_GAIN } },
                );
            });

            await test.step('Verify the staked dashboard', async () => {
                await tronStakingSection.backToOverviewButton.click();
                await expect(stakingSection.stakingEmptyCard).toBeHidden();
                await expect(tronStakingSection.stakedAmount).toHaveText(STAKE_AMOUNT_FORMATTED);
                await expect(tronStakingSection.stakedCardApr).toContainTranslation(
                    'TR_EARN_TRON_APR_LABEL',
                );
                await expect(tronStakingSection.stakedCardApr).toContainText(expectedApr);
                await expect(tronStakingSection.stakeButton).toBeEnabled();
                await expect(tronStakingSection.unstakeButton).toBeEnabled();
                await expect(tronStakingSection.voteButton).toBeEnabled();
                await expect(tronStakingSection.votesToAllocateButton).toBeHidden();
                await expect(tronStakingSection.resourceValue('bandwidth')).toHaveText('816/816');
                await expect(tronStakingSection.resourceValue('energy')).toHaveText('0/0');
            });
        },
    );
});
