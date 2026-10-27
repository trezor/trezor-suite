import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import {
    TRON_REPRESENTATIVES,
    TRON_STAKING_TXIDS,
    trxToSun,
} from '../../../support/mocks/tronStakingMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const STAKED_AMOUNT = 60;
const WITHDRAWABLE_AMOUNT = 40;
const SECONDS_IN_DAY = 24 * 60 * 60;

test.describe('TRX withdrawal', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
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
            unstakingBatches: [
                {
                    amount: trxToSun(WITHDRAWABLE_AMOUNT),
                    expireTime: Math.floor(Date.now() / 1000) - SECONDS_IN_DAY,
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
        'User can withdraw TRX after the unfreezing period',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can withdraw TRX whose 14-day unfreezing period has ended back to the available balance.',
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async ({ walletPage, stakingSection, tronStakingPage, devicePrompt, tronStakingMock }) => {
            await test.step('Open the Tron withdraw flow', async () => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('trx'),
                    type: 'normal',
                    atIndex: 0,
                });
                await stakingSection.stakingTabButton.click();
                await tronStakingPage.withdrawBannerButton.click();
                await expect(tronStakingPage.withdrawTitle).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_TITLE',
                );
                await expect(tronStakingPage.withdrawAmount).toHaveText(
                    `${WITHDRAWABLE_AMOUNT} TRX`,
                );
            });

            await test.step('Withdraw TRX and confirm on device', async () => {
                await tronStakingPage.withdrawContinueButton.click();
                await tronStakingPage.confirmClaimOnDevice('unfrozenBalance');
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.withdraw);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmWithdraw();
            });

            await test.step('Verify the withdrawal summary', async () => {
                await expect(tronStakingPage.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_WITHDRAW_COMPLETE',
                    { timeout: tronStakingPage.transactionConfirmationTimeout },
                );
                await expect(tronStakingPage.completeWithdrawnAmount).toHaveText(
                    `${WITHDRAWABLE_AMOUNT} TRX`,
                );
            });
        },
    );
});
