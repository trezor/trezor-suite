import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import solSimulateClaimTransaction from '../../../fixtures/staking/sol-simulate-claim-transaction.json';
import solSimulateUnstakeTransaction from '../../../fixtures/staking/sol-simulate-unstake-transaction.json';
import {
    solStakingAccountDeactivating,
    solStakingAccountFirst,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Expected values based on our mocked responses
const stakedAmount = solStakingAccountFirst.stakeInSol;
const stakedAmountFormatted = `${stakedAmount} SOL`;
const unstakingAmount = solStakingAccountDeactivating.stakeInSol;
const unstakingAmountFormatted = `${unstakingAmount} SOL`;
const unstakingAndRentFormatted = `${solStakingAccountDeactivating.stakeAndRentInSol} SOL`;

test.describe('sol staking', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        solanaStakingMock.setupStakedAccount();
        solanaStakingMock.setSimulatedTransaction(solSimulateUnstakeTransaction);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'sol', backend: { type: 'solana', url: solanaStakingMock.url } },
            ],
        });
    });

    test(
        'unstake and claim on SOL account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake and claim to his Solana account.',
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, device, walletPage, stakingSection, devicePrompt, solanaStakingMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: stakedAmount,
                        rewards: '0',
                        unstaking: 'hidden',
                    },
                });
                await expect(stakingSection.claimCard).toBeHidden();
            });

            await test.step('Open unstaking form', async () => {
                await stakingSection.unstakeToClaimButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_UNSTAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText(
                    stakedAmountFormatted,
                );
                await expect(stakingSection.cryptoInput).toHaveValue(stakedAmount);
            });

            await test.step('Initiate unstaking and confirm on device', async () => {
                await stakingSection.unstakeButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_UNSTAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_UNSTAKE_FROM_STAKE_ACCOUNT',
                    { values: { symbol: 'SOL' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Unstake' },
                        body: [['Unstake SOL from', '\n', 'stake account?']],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Unstake SOL from stake', '\n', 'account?']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    stakedAmountFormatted,
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    solanaStakingMock.unstakeFeeFormatted,
                );

                const feeWrapped = device.wrapText(solanaStakingMock.unstakeFeeFormatted, {
                    wrapByWords: true,
                });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Unstake' },
                        body: [['Transaction fee'], feeWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Send Unstake and verify on dashboard', async () => {
                solanaStakingMock.confirmTransaction();
                await devicePrompt.sendButton.click();
                await stakingSection.verifyStakingToast({
                    type: 'unstaked',
                    account: 'Solana #1',
                    amount: stakedAmountFormatted,
                });
                solanaStakingMock.setupUnstakingAccount();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: '0',
                        rewards: '0',
                        unstaking: unstakingAmount,
                    },
                    options: { fastForward: stakingSection.solanaEpochCachePeriod },
                });
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
            });

            solanaStakingMock.setSimulatedTransaction(solSimulateClaimTransaction);

            await test.step('Wait few epochs for claim to be available', async () => {
                solanaStakingMock.advanceEpoch();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: '0',
                        rewards: '0',
                        unstaking: 'hidden',
                    },
                    options: { fastForward: stakingSection.solanaEpochCachePeriod },
                });
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.claimCard).toBeVisible();
                await expect(stakingSection.claimBalanceWithSymbol).toHaveText(
                    unstakingAmountFormatted,
                );
                await stakingSection.claimButton.click();
            });

            await test.step('Finish claiming', async () => {
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_CLAIM_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await expect(stakingSection.claimModalAmount).toHaveText(unstakingAmountFormatted);
                await stakingSection.claimModalButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_CLAIM_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_CLAIM_FROM_STAKE_ACCOUNT',
                    { values: { symbol: 'SOL' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [['Claim SOL from', '\n', 'stake account?']],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Claim SOL from stake', '\n', 'account?']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    unstakingAndRentFormatted,
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    solanaStakingMock.claimFeeFormatted,
                );

                const feeWrapped = device.wrapText(solanaStakingMock.claimFeeFormatted, {
                    wrapByWords: true,
                });
                const amountWrapped = device.wrapText(unstakingAndRentFormatted, {
                    wrapByWords: true,
                });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [['Amount'], amountWrapped, ['Transaction fee'], feeWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                solanaStakingMock.setStakeAccounts([]);
                await devicePrompt.sendButton.click();
                await stakingSection.verifyStakingToast({
                    type: 'claimed',
                    account: 'Solana #1',
                    amount: unstakingAndRentFormatted,
                });
            });

            await test.step('Verify dashboard is back to initial state', async () => {
                solanaStakingMock.advanceEpoch();
                await expect(async () => {
                    await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                    await expect(stakingSection.stakingEmptyCard).toBeVisible();
                    await expect(stakingSection.claimCard).toBeHidden();
                    await expect(stakingSection.startStakingButton).toBeVisible();
                }).toPass({ timeout: 10_000 });
            });
        },
    );
});
