import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../../support/testExtends/customMatchers';

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
                await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.stakingDashboardCard).toBeHidden();
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(stakingSection.stakeMoreButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.startStakingButton.click();
                await expect(page.getByTestId('@modal/header')).toHaveTranslation(
                    'TR_STAKE_STAKING_IN_A_NUTSHELL',
                );
                await stakingSection.continueButton.click();
                await expect(page.getByTestId('@modal/header')).toHaveTranslation(
                    'TR_STAKE_STAKE_TOKEN',
                    { values: { symbol: 'SOL' } },
                );
                await stakingSection.everstakeAcknowledgeCheckbox.click();
                await stakingSection.confirmButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('1,000 SOL');
                await stakingSection.cryptoInput.fill('0.010322961');
            });

            await test.step('Initiate staking and confirm on device', async () => {
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
                    '0.010322961 SOL',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.00228788 SOL',
                );

                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [
                        ['Amount:'],
                        splitStringByDisplayLimit('0.012605841 SOL'),
                        [' '],
                        ['Max fees and rent:'],
                        splitStringByDisplayLimit('0.00228788 SOL'),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            solanaStakingMock.enableRoutes([
                'sendTransaction',
                'getSignaturesForAddress',
                'getProgramAccounts',
            ]);

            await devicePrompt.sendButton.click();
            await expect(stakingSection.stakedToast).toHaveTranslation('TOAST_TX_STAKED', {
                values: {
                    amount: '0.010322961 SOL',
                    account: 'Solana #1',
                },
            });

            await stakingSection.expectStakingAmounts({
                pending: 'hidden',
                staked: '0.010322961',
                rewards: '0',
                unstaking: 'hidden',
            });
            await expect(stakingSection.stakeMoreButton).toBeEnabled();
            await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
        },
    );
});
