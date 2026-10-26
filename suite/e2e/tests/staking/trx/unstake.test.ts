import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { TRON_MOCKED_ADDRESS } from '../../../support/mocks/tron-endpoints';
import {
    TRON_REPRESENTATIVES,
    TRON_STAKING_TXIDS,
    trxToSun,
} from '../../../support/mocks/tronStakingMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const STAKED_AMOUNT = 100;
const VOTED_AMOUNT = 60;
const UNSTAKE_AMOUNT = 40;

test.describe('TRX unstaking', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
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
            availableVotingPower: String(STAKED_AMOUNT - VOTED_AMOUNT),
            votes: [
                {
                    address: TRON_REPRESENTATIVES.luganodes.address,
                    voteCount: String(VOTED_AMOUNT),
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
        'User can unstake frozen TRX',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can unfreeze part of the TRX frozen for bandwidth that is not used for votes.',
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async ({ walletPage, stakingSection, tronStakingPage, devicePrompt, tronStakingMock }) => {
            await test.step('Open the Tron unstake flow', async () => {
                await walletPage.openAccount({
                    symbol: asNetworkSymbol('trx'),
                    type: 'normal',
                    atIndex: 0,
                });
                await stakingSection.stakingTabButton.click();
                await expect(tronStakingPage.stakedCard).toBeVisible();
                await tronStakingPage.stakedCardUnstakeButton.click();
                await expect(tronStakingPage.unstakeTitle).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKE_TITLE',
                );
            });

            await test.step('Unstake TRX and confirm on device', async () => {
                await tronStakingPage.unstakeAmountInput.fill(String(UNSTAKE_AMOUNT));
                await tronStakingPage.unstakeContinueButton.click();
                await tronStakingPage.confirmResourceOperationOnDevice({
                    ownerAddress: TRON_MOCKED_ADDRESS,
                    amount: UNSTAKE_AMOUNT,
                    resource: 'bandwidth',
                });
                tronStakingMock.setNextBroadcastTxid(TRON_STAKING_TXIDS.unfreeze);
                await devicePrompt.sendButton.click();
                tronStakingMock.confirmUnfreeze({ amount: UNSTAKE_AMOUNT, resource: 'bandwidth' });
            });

            await test.step('Verify the unstake summary', async () => {
                await expect(tronStakingPage.completeHeading).toHaveTranslation(
                    'TR_EARN_TRON_UNSTAKE_COMPLETE',
                    { timeout: tronStakingPage.transactionConfirmationTimeout },
                );
                await expect(tronStakingPage.completeUnstakedAmount).toHaveText(
                    `${UNSTAKE_AMOUNT} TRX`,
                );
            });
        },
    );
});
