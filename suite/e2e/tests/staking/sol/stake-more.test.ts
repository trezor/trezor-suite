import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import {
    solStakingAccountFirst,
    solStakingAccountSecond,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Expected values based on our mocked responses
const stakedAmount = solStakingAccountFirst.stakeInSol;
const stakeMoreAmount = solStakingAccountSecond.stakeInSol;
const stakeMoreAmountFormatted = `${stakeMoreAmount} SOL`;
const totalStakedAmount = (Number(stakedAmount) + Number(stakeMoreAmount)).toFixed(9);

test.describe('sol staking', { tag: ['@group=staking', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await solanaStakingMock.setupStakedAccount();
        await solanaStakingMock.setEpoch(solStakingAccountSecond.activationEpoch);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['sol'],
            disableNetworks: ['btc'],
        });
    });

    test(
        'stake more on SOL account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake more from his Solana account.',
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, stakingSection, devicePrompt, solanaStakingMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: stakedAmount,
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.stakeMoreButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_STAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('1,000 SOL');
                await stakingSection.cryptoInput.fill(stakeMoreAmount);
            });

            await test.step('Initiate staking and confirm on device', async () => {
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_STAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await stakingSection.continueButton.click();
                await stakingSection.acknowledgeCheckbox.click();
                await stakingSection.confirmAndStakeButton.click();

                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_STAKE_ON_EVERSTAKE',
                    { values: { symbol: 'SOL' } },
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [['Stake SOL on', '\n', 'Everstake?']],
                        actions: { right_button: 'Continue' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                // labeled as total but excludes fees
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    stakeMoreAmountFormatted,
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    solanaStakingMock.feeFormatted,
                );

                const feeWrapped = devicePrompt.wrapText(solanaStakingMock.feeFormatted, {
                    isAmount: true,
                });
                const amountAndFeeWrapped = devicePrompt.wrapText(
                    solanaStakingMock.addFeeTo(stakeMoreAmount),
                    { isAmount: true },
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [
                            ['Max fees and rent:'],
                            feeWrapped,
                            ['Amount:'],
                            amountAndFeeWrapped,
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        body: [
                            ['Amount:'],
                            amountAndFeeWrapped,
                            ['Max fees and rent:'],
                            feeWrapped,
                        ],
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                solanaStakingMock.enableRoutesForTransactions();
                await solanaStakingMock.setProgramAccounts([
                    solStakingAccountFirst.payload,
                    solStakingAccountSecond.payload,
                ]);
                await devicePrompt.sendButton.click();
                await expect(stakingSection.stakedToast).toHaveTranslation('TOAST_TX_STAKED', {
                    values: {
                        amount: stakeMoreAmountFormatted,
                        account: 'Solana #1',
                    },
                });
            });

            await test.step('Verify pending on dashboard', async () => {
                await stakingSection.expectStakingAmounts({
                    pending: stakeMoreAmount,
                    staked: stakedAmount,
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
            });

            await test.step('Wait an epoch and amount moved from pending to staked', async () => {
                await solanaStakingMock.advanceEpoch();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: totalStakedAmount,
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
            });
        },
    );
});
