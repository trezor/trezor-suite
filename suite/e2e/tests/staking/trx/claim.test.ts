import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';
import { BigNumber } from '@trezor/utils';

import {
    buildTrxClaimedAccountState,
    buildTrxRewardedAccountState,
    formatSunAsTrx,
    trxToSun,
} from '../../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { TRON_LUGANODES_ADDRESS } from '../../../support/mocks/tronEarnApiMock';
import { TRX_BEST_BLOCK, TRX_MOCKED_ACCOUNT } from '../../../support/mocks/trx-endpoints';

const trxSymbol = asNetworkSymbol('trx');

const STAKE_AMOUNT = '100';
const STAKE_AMOUNT_SUN = trxToSun(STAKE_AMOUNT);
const STAKE_AMOUNT_FORMATTED = `${STAKE_AMOUNT} TRX`;
const REWARD_AMOUNT = '1.5';
const REWARD_AMOUNT_SUN = trxToSun(REWARD_AMOUNT);
const REWARD_AMOUNT_FORMATTED = `${REWARD_AMOUNT} TRX`;
const BALANCE_BEFORE_SUN = new BigNumber(TRX_MOCKED_ACCOUNT.balance)
    .minus(STAKE_AMOUNT_SUN)
    .toFixed();
const BALANCE_BEFORE_FORMATTED = formatSunAsTrx(BALANCE_BEFORE_SUN);
const BALANCE_AFTER_FORMATTED = formatSunAsTrx(
    new BigNumber(BALANCE_BEFORE_SUN).plus(REWARD_AMOUNT_SUN).toFixed(),
);
// Txids of the transactions already in the mocked history when the test starts.
const FREEZE_TXID = '0e47dc1def1a4c96e23e298ca2af8a1d6ab58747b6c830505d2d0a9505c832b0';
const VOTE_TXID = 'b4b7e9a522e5cc2d728fb003bd72abd07f316e1eecdb26c59b016776e4cb2c02';

const rewardedAccount = {
    stakeAmount: STAKE_AMOUNT,
    stakeAmountSun: STAKE_AMOUNT_SUN,
    freezeTxid: FREEZE_TXID,
    voteTxid: VOTE_TXID,
    representativeAddress: TRON_LUGANODES_ADDRESS,
    rewardAmountSun: REWARD_AMOUNT_SUN,
};

test.describe('Staking - Tron', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Enable Tron with a voted account that has unclaimed rewards', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('trx');
            blockbookMock.updateAccountState(buildTrxRewardedAccountState(rewardedAccount));
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: trxSymbol, backend: { type: 'blockbook', url: blockbookMock.url } },
                ],
            });
        });
    });

    test(
        'Claim Tron voting rewards',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can claim the voting rewards earned by staked TRX.',
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
            await test.step('Verify the dashboard with unclaimed rewards', async () => {
                await walletPage.openAccount({ symbol: trxSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    BALANCE_BEFORE_FORMATTED,
                );
                await expect(tronStakingSection.stakedAmount).toHaveText(STAKE_AMOUNT_FORMATTED);
                await expect(tronStakingSection.rewardsAmount).toHaveText(REWARD_AMOUNT_FORMATTED);
                await expect(tronStakingSection.claimButton).toBeEnabled();
            });

            await test.step('Open the claim form', async () => {
                await tronStakingSection.claimButton.click();
                await expect(tronStakingSection.claimTitle).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_TITLE',
                );
                await expect(tronStakingSection.claimAmount).toHaveText(REWARD_AMOUNT_FORMATTED);
                await tronStakingSection.claimContinueButton.click();
            });

            await test.step('Confirm the claim on device and broadcast', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [device.wrapText('Claim voting rewards?', { wrapByWords: true })],
                        actions: { right_button: 'Hold to confirm' },
                    },
                    T3T1: {
                        body: [['Claim voting rewards?']],
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await expect(tronStakingSection.reviewClaimNote).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_CONFIRM',
                );
                await devicePrompt.sendButton.click();
                await expect(tronStakingSection.pendingTransactionTitle).toHaveTranslation(
                    'TR_EARN_TRON_PENDING_CLAIM',
                );
                await expect(tronStakingSection.toastMessage('tx-claimed')).toHaveTranslation(
                    'TOAST_TX_CLAIM_PENDING',
                );
                await tronStakingSection.dismissToast('tx-claimed');
            });

            await test.step('Confirm the claim on chain and verify the summary', async () => {
                blockbookMock.updateAccountState(
                    buildTrxClaimedAccountState({
                        ...rewardedAccount,
                        claimTxid: blockbookMock.lastBroadcastTxid,
                        claimTime: Math.floor(Date.now() / 1000),
                    }),
                );
                await blockbookMock.sendNewBlockNotification({
                    height: TRX_BEST_BLOCK.height + 3,
                    hash: TRX_BEST_BLOCK.hash,
                });
                await expect(tronStakingSection.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_COMPLETE',
                    { timeout: tronStakingSection.chainConfirmationTimeout },
                );
                await expect(tronStakingSection.completeDescription).toHaveTranslation(
                    'TR_EARN_TRON_CLAIM_DESCRIPTION',
                );
                await expect(tronStakingSection.toastMessage('tx-claimed')).toHaveTranslation(
                    'TOAST_TX_CLAIM_CONFIRMED',
                );
                await tronStakingSection.dismissToast('tx-claimed');
                await expect(tronStakingSection.summaryClaimedAmount).toHaveText(
                    REWARD_AMOUNT_FORMATTED,
                );
            });

            await test.step('Verify the claimed dashboard', async () => {
                await tronStakingSection.backToOverviewButton.click();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    BALANCE_AFTER_FORMATTED,
                );
                await expect(tronStakingSection.stakedAmount).toHaveText(STAKE_AMOUNT_FORMATTED);
                const luganodes = tronEarnApiMock.representatives.find(
                    ({ address }) => address === TRON_LUGANODES_ADDRESS,
                );
                await expect(tronStakingSection.stakedCardAprValue).toHaveText(
                    `${luganodes?.apr}%`,
                );
                await expect(tronStakingSection.rewardsCard).toBeHidden();
                await expect(tronStakingSection.withdrawReadyBanner).toBeHidden();
                await expect(tronStakingSection.unstakingCard).toBeHidden();
            });
        },
    );
});
