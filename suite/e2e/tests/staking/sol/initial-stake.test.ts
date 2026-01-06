import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { solStakingAccountFirst } from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../../support/testExtends/customMatchers';

// Expected values based on our mocked responses
const stakedAmount = solStakingAccountFirst.stakeInSol;
const stakedAmountFormatted = `${stakedAmount} SOL`;

test.describe('sol staking', { tag: ['@group=staking', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await solanaStakingMock.routeSolana();
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['sol'],
            disableNetworks: ['btc'],
        });
    });

    test(
        'first stake on SOL account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can do first stake from his clean Solana account.',
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
                await expect(stakingSection.stakingDashboardCard).toBeHidden();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(stakingSection.stakeMoreButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.startStakingButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_STAKING_IN_A_NUTSHELL');
                await stakingSection.continueButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_STAKE_TOKEN', {
                    values: { symbol: 'SOL' },
                });
                await stakingSection.everstakeAcknowledgeCheckbox.click();
                await stakingSection.confirmButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('1,000 SOL');
                await stakingSection.cryptoInput.fill(stakedAmount);
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
                    header: { title: 'Stake' },
                    body: [['Stake SOL on', '\n', 'Everstake?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    stakedAmountFormatted,
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    solanaStakingMock.feeFormatted,
                );

                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [
                        ['Amount:'],
                        splitStringByDisplayLimit(solanaStakingMock.addFeeTo(stakedAmount)),
                        [' '],
                        ['Max fees and rent:'],
                        splitStringByDisplayLimit(solanaStakingMock.feeFormatted),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                solanaStakingMock.enableRoutesForTransactions();
                await solanaStakingMock.setProgramAccounts([solStakingAccountFirst.payload]);
                await devicePrompt.sendButton.click();
                await expect(stakingSection.stakedToast).toHaveTranslation('TOAST_TX_STAKED', {
                    values: {
                        amount: stakedAmountFormatted,
                        account: 'Solana #1',
                    },
                });
            });

            await test.step('Verify pending on dashboard', async () => {
                await stakingSection.expectStakingAmounts({
                    pending: stakedAmount,
                    staked: '0',
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await stakingSection.expectProgressIndicatorsToMatchPhase('addingToPool');
            });

            await test.step('Wait an epoch and amount moved from pending to staked', async () => {
                await solanaStakingMock.advanceEpoch();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: stakedAmount,
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.stakeMoreButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
            });
        },
    );
});
