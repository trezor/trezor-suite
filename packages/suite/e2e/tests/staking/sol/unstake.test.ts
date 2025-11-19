import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('SOL unstaking and claim', { tag: ['@group=staking', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, solanaStakingMock }) => {
        await solanaStakingMock.setupStakedAccount();
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['sol'],
            disableNetworks: ['btc'],
        });
    });

    test(
        'unstake and claim on SOL account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake and claim on his Solana account.',
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
                    staked: '0.200953787',
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.claimCard).toBeHidden();
            });

            await test.step('Open unstaking form', async () => {
                await stakingSection.unstakeToClaimButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText(
                    '0.200953787 SOL',
                );
                await expect(stakingSection.cryptoInput).toHaveValue('0.200953787');
            });

            await test.step('Initiate unstaking and confirm on device', async () => {
                await stakingSection.unstakeButton.click();
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    //TODO: why not from everstake account
                    'TR_UNSTAKE_FROM_STAKE_ACCOUNT',
                    { values: { symbol: 'SOL' } },
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [['Unstake SOL from stake', '\n', 'account?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    '0.200953787 SOL',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.00228788 SOL',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [['Transaction fee:'], [`0.000005 SOL`]],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Send Unstake and verify on dashboard', async () => {
                solanaStakingMock.enableRoutesForTransactions();
                await devicePrompt.sendButton.click();
                await expect(stakingSection.unstakedToast).toContainTranslation(
                    'TOAST_TX_UNSTAKED',
                    { values: { amount: '0.200953787 SOL' } },
                );
                await solanaStakingMock.setupUnstakingAccount();
                await page.clock.fastForward(stakingSection.solanaEpochCachePeriod);
                await stakingSection.expectStakingAmounts({
                    pending: 'hidden',
                    staked: '0',
                    rewards: '0',
                    unstaking: '0.033742393',
                });
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
                await expect(stakingSection.claimBalanceWithSymbol).toHaveText('0.033742393 SOL');
                await stakingSection.claimButton.click();
            });

            await test.step('Finish claiming', async () => {
                await expect(stakingSection.claimModalAmount).toHaveText('0.033742393 SOL');
                await stakingSection.claimModalButton.click();
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_CLAIM_FROM_STAKE_ACCOUNT',
                    { values: { symbol: 'SOL' } },
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Claim' },
                    body: [['Claim SOL from stake', '\n', 'account?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                    '0.033742393 SOL',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.00228788 SOL',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Claim' },
                    body: [
                        ['Amount:'],
                        ['0.036025273 SOL'],
                        [' '],
                        ['Transaction fee:'],
                        ['0.000005 SOL'],
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await solanaStakingMock.setProgramAccounts([]);
                await devicePrompt.sendButton.click();
                await expect(stakingSection.claimedToast).toContainTranslation('TOAST_TX_CLAIMED', {
                    values: { amount: '0.033742393 SOL' },
                });
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
