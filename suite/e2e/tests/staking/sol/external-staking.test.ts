import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import {
    solStakingAccountExternal,
    solStakingAccountFirst,
} from '../../../fixtures/staking/sol-staking-accounts';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const solSymbol = asNetworkSymbol('sol');

const externalStakedAmount = solStakingAccountExternal.stakeInSol;
const everstakeStakedAmount = solStakingAccountFirst.stakeInSol;

test.describe('sol staking', { tag: ['@T3W1', '@T3T1', '@optional'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ solanaStakingMock }) => {
        await solanaStakingMock.setEpoch(solStakingAccountExternal.activationEpoch + 1);
    });

    test(
        'display stake made outside of Trezor Suite on SOL account',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a Solana stake delegated to a validator other than Everstake is shown as staking outside of Trezor Suite, while the Everstake staking stays empty.',
                category: TestCategory.Solana,
                priority: TestPriority.Medium,
                stream: TestStream.Earn,
            }),
        },
        async ({ onboardingPage, settingsPage, walletPage, stakingSection, solanaStakingMock }) => {
            solanaStakingMock.setStakeAccounts([solStakingAccountExternal.payload]);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: solSymbol, backend: { type: 'solana', url: solanaStakingMock.url } },
                ],
            });

            await test.step('Open staking dashboard', async () => {
                await walletPage.openAccount({ symbol: solSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
            });

            await test.step('Verify external stake is shown next to empty staking', async () => {
                await stakingSection.expectExternalStakingCard({
                    amount: externalStakedAmount,
                    displaySymbol: 'SOL',
                });
                await expect(stakingSection.stakingEmptyCard).toBeVisible();
                await expect(stakingSection.startStakingButton).toBeEnabled();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: 'hidden',
                        rewards: 'hidden',
                        unstaking: 'hidden',
                    },
                });
                await expect(stakingSection.stakeMoreButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
            });
        },
    );

    test(
        'display stake made outside of Trezor Suite on SOL account with Everstake stake',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a Solana stake delegated to a validator other than Everstake is shown separately and is not counted in the Everstake staking dashboard.',
                category: TestCategory.Solana,
                priority: TestPriority.Medium,
                stream: TestStream.Earn,
            }),
        },
        async ({ onboardingPage, settingsPage, walletPage, stakingSection, solanaStakingMock }) => {
            solanaStakingMock.setStakeAccounts([
                solStakingAccountFirst.payload,
                solStakingAccountExternal.payload,
            ]);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: solSymbol, backend: { type: 'solana', url: solanaStakingMock.url } },
                ],
            });

            await test.step('Open staking dashboard', async () => {
                await walletPage.openAccount({ symbol: solSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
            });

            await test.step('Verify external stake is shown apart from Everstake stake', async () => {
                await stakingSection.expectExternalStakingCard({
                    amount: externalStakedAmount,
                    displaySymbol: 'SOL',
                });
                await expect(stakingSection.stakingEmptyCard).toBeHidden();
                await stakingSection.expectStakingAmounts({
                    expected: {
                        pending: 'hidden',
                        staked: everstakeStakedAmount,
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
