import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import solSimulateClaimTransactionResponse from '../../../fixtures/staking/sol-simulate-claim-transaction.json';
import solSimulateUnstakeTransactionResponse from '../../../fixtures/staking/sol-simulate-unstake-transaction.json';
import {
    solStakingAccountDeactivating,
    solStakingAccountFirst,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { fulfillWithResult } from '../../../support/mocks/solanaStakingMock';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Expected values based on our mocked responses
const stakedAmount = solStakingAccountFirst.stakeInSol;
const stakedAmountFormatted = `${stakedAmount} SOL`;
const unstakingAmount = solStakingAccountDeactivating.stakeInSol;
const unstakingAmountFormatted = `${unstakingAmount} SOL`;
const unstakingAndRentFormatted = `${solStakingAccountDeactivating.stakeAndRentInSol} SOL`;

test.describe('sol staking', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await solanaStakingMock.setupStakedAccount();
        // Mock simulate unstake transaction response
        await solanaStakingMock.replaceRoute('simulateTransaction', {
            respond: async (route, body) => {
                await fulfillWithResult(route, body, {
                    value: solSimulateUnstakeTransactionResponse,
                });
            },
        });
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
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
                    pending: 'hidden',
                    staked: stakedAmount,
                    rewards: '0',
                    unstaking: 'hidden',
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
                solanaStakingMock.enableRoutesForTransactions();
                await devicePrompt.sendButton.click();
                await expect(stakingSection.unstakedToastAccount).toContainText('Solana #1');
                await expect(stakingSection.unstakedToastAmount).toContainText(
                    stakedAmountFormatted,
                );
                await solanaStakingMock.setupUnstakingAccount();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '0',
                    rewards: '0',
                    unstaking: unstakingAmount,
                });
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
            });

            // Mock simulate claim transaction response
            await solanaStakingMock.replaceRoute('simulateTransaction', {
                respond: async (route, body) => {
                    await fulfillWithResult(route, body, {
                        value: solSimulateClaimTransactionResponse,
                    });
                },
            });

            await test.step('Wait few epochs for claim to be available', async () => {
                await solanaStakingMock.advanceEpoch();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '0',
                    rewards: '0',
                    unstaking: 'hidden',
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
                await solanaStakingMock.setProgramAccounts([]);
                await devicePrompt.sendButton.click();
                await expect(stakingSection.claimedToastAccount).toContainText('Solana #1');
                await expect(stakingSection.claimedToastAmount).toContainText(
                    unstakingAndRentFormatted,
                );
            });

            await test.step('Verify dashboard is back to initial state', async () => {
                await solanaStakingMock.advanceEpoch();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(stakingSection.claimCard).toBeHidden();
                await expect(stakingSection.startStakingButton).toBeVisible();
            });
        },
    );
});
