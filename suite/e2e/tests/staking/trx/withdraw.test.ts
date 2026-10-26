import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import {
    buildTrxUnstakingAccountState,
    buildTrxWithdrawnAccountState,
    formatSunAsTrx,
    getTrxBandwidthGain,
    trxToSun,
} from '../../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { TRON_LUGANODES_ADDRESS } from '../../../support/mocks/tronEarnApiMock';
import {
    TRX_BEST_BLOCK,
    TRX_MOCKED_ACCOUNT,
    TRX_MOCKED_RESOURCES,
} from '../../../support/mocks/trx-endpoints';

const trxSymbol = asNetworkSymbol('trx');

const STAKE_AMOUNT = '100';
const STAKE_AMOUNT_SUN = trxToSun(STAKE_AMOUNT);
const UNSTAKE_AMOUNT = '40';
const UNSTAKE_AMOUNT_SUN = trxToSun(UNSTAKE_AMOUNT);
const UNSTAKE_AMOUNT_FORMATTED = `${UNSTAKE_AMOUNT} TRX`;
const REMAINING_STAKE_FORMATTED = '60 TRX';
const BALANCE_BEFORE_SUN = new BigNumber(TRX_MOCKED_ACCOUNT.balance)
    .minus(STAKE_AMOUNT_SUN)
    .toFixed();
const BALANCE_BEFORE_FORMATTED = formatSunAsTrx(BALANCE_BEFORE_SUN);
const BALANCE_AFTER_FORMATTED = formatSunAsTrx(
    new BigNumber(BALANCE_BEFORE_SUN).plus(UNSTAKE_AMOUNT_SUN).toFixed(),
);
const REMAINING_BANDWIDTH =
    TRX_MOCKED_RESOURCES.totalFreeBandwidth +
    getTrxBandwidthGain(STAKE_AMOUNT) -
    getTrxBandwidthGain(UNSTAKE_AMOUNT);
// Txids of the transactions already in the mocked history when the test starts.
const FREEZE_TXID = '0e47dc1def1a4c96e23e298ca2af8a1d6ab58747b6c830505d2d0a9505c832b0';
const VOTE_TXID = 'b4b7e9a522e5cc2d728fb003bd72abd07f316e1eecdb26c59b016776e4cb2c02';
const UNSTAKE_TXID = '3c1f0a9d6b5e4f2a8c7d1e0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a09';

// The unfreeze batch expired an hour ago, so it is ready to withdraw.
const unstakedAccount = {
    stakeAmount: STAKE_AMOUNT,
    stakeAmountSun: STAKE_AMOUNT_SUN,
    freezeTxid: FREEZE_TXID,
    voteTxid: VOTE_TXID,
    representativeAddress: TRON_LUGANODES_ADDRESS,
    unstakeAmount: UNSTAKE_AMOUNT,
    unstakeAmountSun: UNSTAKE_AMOUNT_SUN,
    unstakeTxid: UNSTAKE_TXID,
    expireTime: Math.floor(Date.now() / 1000) - 60 * 60,
};

test.describe('Staking - Tron', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Enable Tron with an account whose unstaked TRX is withdrawable', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('trx');
            blockbookMock.updateAccountState(buildTrxUnstakingAccountState(unstakedAccount));
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: trxSymbol, backend: { type: 'blockbook', url: blockbookMock.url } },
                ],
            });
        });
    });

    test(
        'Withdraw unstaked Tron',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can withdraw TRX whose unstaking period has elapsed.',
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
            await test.step('Verify the withdrawable dashboard', async () => {
                await walletPage.openAccount({ symbol: trxSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    BALANCE_BEFORE_FORMATTED,
                );
                await expect(tronStakingSection.stakedAmount).toHaveText(REMAINING_STAKE_FORMATTED);
                await expect(tronStakingSection.unstakingCard).toBeHidden();
                await expect(tronStakingSection.withdrawReadyDescription).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_READY',
                    { values: { amount: UNSTAKE_AMOUNT_FORMATTED } },
                );
            });

            await test.step('Open the withdraw form', async () => {
                await tronStakingSection.withdrawReadyButton.click();
                await expect(tronStakingSection.withdrawTitle).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_TITLE',
                );
                await expect(tronStakingSection.withdrawAmount).toHaveText(
                    UNSTAKE_AMOUNT_FORMATTED,
                );
                await tronStakingSection.withdrawContinueButton.click();
            });

            await test.step('Confirm the withdraw on device and broadcast', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [device.wrapText('Claim unfrozen balance?', { wrapByWords: true })],
                        actions: { right_button: 'Hold to confirm' },
                    },
                    T3T1: {
                        body: [['Claim unfrozen balance?']],
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(tronStakingSection.reviewWithdrawNote).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_WITHDRAW',
                );
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_WITHDRAW',
                );
                await expect(tronStakingSection.toastMessage('tx-withdrawn')).toHaveTranslation(
                    'TOAST_TX_WITHDRAW_PENDING',
                );
                await tronStakingSection.dismissToast('tx-withdrawn');
            });

            await test.step('Confirm the withdraw on chain and verify the summary', async () => {
                blockbookMock.updateAccountState(
                    buildTrxWithdrawnAccountState({
                        ...unstakedAccount,
                        withdrawTxid: blockbookMock.lastBroadcastTxid,
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 4,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_COMPLETE',
                    { timeout: tronStakingSection.chainConfirmationTimeout },
                );
                await expect(tronStakingSection.completeDescription).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_DESCRIPTION',
                );
                await expect(tronStakingSection.toastMessage('tx-withdrawn')).toHaveTranslation(
                    'TOAST_TX_WITHDRAW_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-withdrawn');
                await expect(tronStakingSection.summaryWithdrawnAmount).toHaveText(
                    UNSTAKE_AMOUNT_FORMATTED,
                );
            });

            await test.step('Verify the withdrawn dashboard', async () => {
                await tronStakingSection.backToOverviewButton.click();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    BALANCE_AFTER_FORMATTED,
                );
                await expect(tronStakingSection.stakedAmount).toHaveText(REMAINING_STAKE_FORMATTED);
                const luganodes = tronEarnApiMock.representatives.find(
                    ({ address }) => address === TRON_LUGANODES_ADDRESS,
                );
                await expect(tronStakingSection.stakedCardAprValue).toHaveText(
                    `${luganodes?.apr}%`,
                );
                await expect(tronStakingSection.withdrawReadyBanner).toBeHidden();
                await expect(tronStakingSection.unstakingCard).toBeHidden();
                await expect(tronStakingSection.resourceValue('bandwidth')).toHaveText(
                    `${REMAINING_BANDWIDTH}/${REMAINING_BANDWIDTH}`,
                );
            });
        },
    );
});
