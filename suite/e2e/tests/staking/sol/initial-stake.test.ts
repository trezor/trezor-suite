import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { solStakingAccountFirst } from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

// Expected values based on our mocked responses
const stakedAmount = solStakingAccountFirst.stakeInSol;
const stakedAndRentFormatted = `${solStakingAccountFirst.stakeAndRentInSol} SOL`;

test.describe('sol staking', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'sol', backend: { type: 'solana', url: solanaStakingMock.url } },
            ],
        });
    });

    test(
        'first stake on SOL account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can do first stake from his clean Solana account.',
                category: TestCategory.Solana,
                priority: TestPriority.Critical,
                stream: TestStream.Earn,
            }),
        },
        async ({ page, device, walletPage, stakingSection, devicePrompt, solanaStakingMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.startStakingButton).toBeVisible();
                await expect(stakingSection.stakingDashboardCard).toBeHidden();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(stakingSection.stakeMoreButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.startStakingButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKING_IN_A_NUTSHELL');
                await stakingSection.continueButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await stakingSection.everstakeAcknowledgeCheckbox.click();
                await stakingSection.confirmButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('1,000 SOL');
                await stakingSection.cryptoInput.fill(stakedAmount);
            });

            await test.step('Initiate staking and confirm on device', async () => {
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await stakingSection.continueButton.click();
                await stakingSection.acknowledgeCheckbox.click();
                await stakingSection.confirmAndStakeButton.click();

                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_STAKE_ON_EVERSTAKE',
                    { values: { symbol: 'SOL' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [['Stake SOL on', '\n', 'Everstake?']],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Stake SOL on Everstake?']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    stakedAndRentFormatted,
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    solanaStakingMock.stakeFeeFormatted,
                );

                const feeWrapped = device.wrapText(solanaStakingMock.stakeFeeFormatted, {
                    wrapByWords: true,
                });
                const amountWrapped = device.wrapText(stakedAndRentFormatted, {
                    wrapByWords: true,
                });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Stake' },
                        body: [['Amount'], amountWrapped, ['Max fees and rent'], feeWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                solanaStakingMock.confirmTransaction();
                solanaStakingMock.setStakeAccounts([solStakingAccountFirst.payload]);
                await devicePrompt.sendButton.click();
                await stakingSection.verifyStakingToast({
                    type: 'staked',
                    account: 'Solana #1',
                    amount: stakedAndRentFormatted,
                });
            });

            await test.step('Verify pending on dashboard', async () => {
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: stakedAmount,
                        staked: '0',
                        rewards: '0',
                        unstaking: 'hidden',
                    },
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
            });

            await test.step('Wait an epoch and amount moved from pending to staked', async () => {
                await solanaStakingMock.advanceEpoch();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: stakedAmount,
                        rewards: '0',
                        unstaking: 'hidden',
                    },
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
            });
        },
    );
});
