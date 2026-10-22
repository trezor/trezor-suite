import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import {
    buildTrxUnstakingAccountState,
    buildTrxVotedAccountState,
    getTrxBandwidthGain,
} from '../../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { TRON_LUGANODES_ADDRESS } from '../../../support/mocks/tronEarnApiMock';
import { TRX_BEST_BLOCK, TRX_FIRST_ACCOUNT_ADDRESS } from '../../../support/mocks/trx-endpoints';

const trxSymbol = asNetworkSymbol('trx');

const TRON_UNSTAKING_PERIOD_DAYS = 14;
const STAKE_AMOUNT = '100';
const STAKE_AMOUNT_SUN = '100000000';
const UNSTAKE_AMOUNT = '40';
const UNSTAKE_AMOUNT_SUN = '40000000';
const UNSTAKE_AMOUNT_FORMATTED = `${UNSTAKE_AMOUNT} TRX`;
const REMAINING_STAKE_FORMATTED = '60 TRX';
const STAKED_BANDWIDTH = getTrxBandwidthGain(STAKE_AMOUNT);
const BANDWIDTH_REDUCTION = getTrxBandwidthGain(UNSTAKE_AMOUNT);
const REMAINING_BANDWIDTH = STAKED_BANDWIDTH - BANDWIDTH_REDUCTION;
// Txids of the transactions already in the mocked history when the test starts.
const FREEZE_TXID = '0e47dc1def1a4c96e23e298ca2af8a1d6ab58747b6c830505d2d0a9505c832b0';
const VOTE_TXID = 'b4b7e9a522e5cc2d728fb003bd72abd07f316e1eecdb26c59b016776e4cb2c02';

const stakedAccount = {
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

        await test.step('Enable Tron with a staked and voted account', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('trx');
            blockbookMock.updateAccountState(buildTrxVotedAccountState(stakedAccount));
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: trxSymbol, backend: { type: 'blockbook', url: blockbookMock.url } },
                ],
            });
        });
    });

    test(
        'Unstake Tron',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unfreeze part of the TRX staked for bandwidth.',
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
            await test.step('Verify the staked dashboard', async () => {
                await walletPage.openAccount({ symbol: trxSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(tronStakingSection.stakedAmount).toHaveText(`${STAKE_AMOUNT} TRX`);
                await expect(tronStakingSection.unstakingCard).toBeHidden();
                await expect(tronStakingSection.withdrawReadyBanner).toBeHidden();
            });

            await test.step('Fill the unstake form', async () => {
                await tronStakingSection.unstakeButton.click();
                await expect(tronStakingSection.unstakeTitle).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKE_TITLE',
                );
                await tronStakingSection.unstakeResourceOption('bandwidth').click();
                await expect(tronStakingSection.unstakeStakedBalanceAmount).toHaveText(
                    `${STAKE_AMOUNT} TRX`,
                );
                await tronStakingSection.unstakeAmountInput.fill(UNSTAKE_AMOUNT);
                await expect(tronStakingSection.unstakeResourceReduction).toHaveTranslation(
                    'TR_EARN_TRON_BANDWIDTH_REDUCTION',
                    { values: { count: BANDWIDTH_REDUCTION } },
                );
                await expect(tronStakingSection.unstakeResourceChange).toHaveText(
                    `${STAKED_BANDWIDTH} → ${REMAINING_BANDWIDTH}`,
                );
                await tronStakingSection.unstakeContinueButton.click();
            });

            await test.step('Confirm the unstake on device and broadcast', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Unstake' },
                        body: [device.wrapText(TRX_FIRST_ACCOUNT_ADDRESS, { lengthOverride: 18 })],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Summary' },
                        body: [['Amount'], [UNSTAKE_AMOUNT_FORMATTED], ['Resource'], ['Bandwidth']],
                        actions: { right_button: 'Hold to confirm' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    UNSTAKE_AMOUNT_FORMATTED,
                );
                await expect(tronStakingSection.reviewResource).toHaveTranslation(
                    'TR_TRON_BANDWIDTH',
                );
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_UNSTAKE',
                );
                await expect(tronStakingSection.toastMessage('tx-unstaked')).toHaveTranslation(
                    'TOAST_TX_UNSTAKE_PENDING',
                );
                await tronStakingSection.dismissToast('tx-unstaked');
            });

            await test.step('Confirm the unstake on chain and verify the summary', async () => {
                blockbookMock.updateAccountState(
                    buildTrxUnstakingAccountState({
                        ...stakedAccount,
                        unstakeAmount: UNSTAKE_AMOUNT,
                        unstakeAmountSun: UNSTAKE_AMOUNT_SUN,
                        unstakeTxid: blockbookMock.lastBroadcastTxid,
                        expireTime:
                            Math.floor(Date.now() / 1000) +
                            TRON_UNSTAKING_PERIOD_DAYS * 24 * 60 * 60,
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 3,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKE_COMPLETE',
                    { timeout: tronStakingSection.chainConfirmationTimeout },
                );
                await expect(tronStakingSection.completeDescription).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKE_DESCRIPTION',
                    { values: { displaySymbol: 'TRX' } },
                );
                await expect(tronStakingSection.toastMessage('tx-unstaked')).toHaveTranslation(
                    'TOAST_TX_UNSTAKE_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-unstaked');
                await expect(tronStakingSection.summaryUnstakedAmount).toHaveText(
                    UNSTAKE_AMOUNT_FORMATTED,
                );
                await expect(tronStakingSection.summaryResourceReduction).toHaveTranslation(
                    'TR_EARN_TRON_BANDWIDTH_REDUCTION',
                    { values: { count: BANDWIDTH_REDUCTION } },
                );
            });

            await test.step('Verify the unstaking dashboard', async () => {
                await tronStakingSection.backToOverviewButton.click();
                await expect(tronStakingSection.stakedAmount).toHaveText(REMAINING_STAKE_FORMATTED);
                const luganodes = tronEarnApiMock.representatives.find(
                    ({ address }) => address === TRON_LUGANODES_ADDRESS,
                );
                await expect(tronStakingSection.stakedCardApr).toContainText(`${luganodes?.apr}%`);
                await expect(tronStakingSection.unstakingRowLocked(0)).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKING_DAYS_LOCKED',
                    { values: { days: TRON_UNSTAKING_PERIOD_DAYS } },
                );
                await expect(tronStakingSection.unstakingRowAmount(0)).toHaveText(
                    UNSTAKE_AMOUNT_FORMATTED,
                );
                await expect(tronStakingSection.withdrawReadyBanner).toBeHidden();
                await expect(tronStakingSection.resourceValue('bandwidth')).toHaveText(
                    `${REMAINING_BANDWIDTH + 600}/${REMAINING_BANDWIDTH + 600}`,
                );
            });
        },
    );
});
