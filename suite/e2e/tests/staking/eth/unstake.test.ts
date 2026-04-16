import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../../fixtures/staking/eth-base-tx.json';
import ETH_UNSTAKE_CONFIRMED_TX from '../../../fixtures/staking/eth-unstake-confirmed-tx.json';
import ETH_UNSTAKE_PENDING_TX from '../../../fixtures/staking/eth-unstake-pending-tx.json';
import { skipFixture } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('ETH unstaking and claim', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
        //TODO: Mock is not handling request for instant unstake information. Fix me
        exceptionLogger: skipFixture,
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coinsTab.enableNetwork('eth');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'unstake and claim on ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake and claim on his Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, device, walletPage, stakingSection, devicePrompt, blockbookMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    pending: '300',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: 'hidden',
                });
            });

            await test.step('Open unstaking form', async () => {
                await stakingSection.unstakeToClaimButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('3,234 ETH');
                await expect(stakingSection.cryptoInput).toHaveValue('3,234');
            });

            await test.step('Initiate unstaking and confirm on device', async () => {
                await stakingSection.unstakeButton.click();
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_UNSTAKE_FROM_EVERSTAKE',
                    { values: { symbol: 'ETH' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Unstake' },
                        body: [['Unstake ETH', '\n', 'from', '\n', 'Everstake?']],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [['Unstake ETH from', '\n', 'Everstake?']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    '3,234 ETH',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.000290278609719 ETH',
                );
                const feeMaxWrapped = device.wrapText('0.000290278609719 ETH', {
                    isAmount: true,
                });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Unstake' },
                        body: [['Amount'], ['3,234 ETH'], ['Maximum fee'], feeMaxWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Unstake all available', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_UNSTAKE_PENDING_TX, ETH_BASE_TX],
                    unconfirmedTxs: 1,
                    txs: 2,
                    nonTokenTxs: 2,
                    nonce: '2',
                });
                await devicePrompt.sendButton.click();
                await expect(stakingSection.unstakedToastAccount).toContainText('Ethereum #1');
                await expect(stakingSection.unstakedToastAmount).toContainText('3234 ETH');
            });

            await test.step('Verify pending transaction', async () => {
                await expect(stakingSection.pendingTransactionText).toBeVisible();
                await expect(stakingSection.speedUpButton).toBeEnabled();
                await stakingSection.expectStakingAmounts({
                    pending: '300',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: 'hidden',
                });
            });

            await test.step('Wait for transaction confirmation and not being able to unstake more', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_UNSTAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '100000000000000000000',
                            pendingDepositedBalance: '200000000000000000000',
                            depositedBalance: '0', // Decreases by 3000
                            withdrawTotalAmount: '3234000000000000000000', // Increases by 3234
                            claimableAmount: '0',
                            restakedReward: '0', // Decreases by 234
                            autocompoundBalance: '0', // Decreases by 3234
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await stakingSection.expectStakingAmounts({
                    pending: '300',
                    staked: '0',
                    rewards: '0',
                    unstaking: '3,234',
                });
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
                await expect(stakingSection.pendingTransactionText).toBeHidden();
                await expect(stakingSection.speedUpButton).toBeHidden();
            });

            await test.step('Wait till amount can be claimed and claim it', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_UNSTAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '100000000000000000000',
                            pendingDepositedBalance: '200000000000000000000',
                            depositedBalance: '0',
                            withdrawTotalAmount: '3234000000000000000000',
                            claimableAmount: '3234000000000000000000', // Increases by 3234
                            restakedReward: '0',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await stakingSection.expectStakingAmounts({
                    pending: '300',
                    staked: '0',
                    rewards: '0',
                    unstaking: 'hidden',
                });
                await expect(stakingSection.claimBalanceWithSymbol).toHaveText('3,234 ETH');
                await stakingSection.claimButton.click();
            });

            await test.step('Finish claiming', async () => {
                await expect(stakingSection.claimModalAmount).toHaveText('3,234 ETH');
                await stakingSection.claimModalButton.click();
                await expect(devicePrompt.outputValueOf('data')).toHaveTranslation(
                    'TR_CLAIM_FROM_EVERSTAKE',
                    { values: { symbol: 'ETH' } },
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [['Claim ETH from', '\n', 'Everstake?']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    '3,234 ETH',
                );
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    '0.000290278609719 ETH',
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Claim' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText('0.000290278609719 ETH', { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                blockbookMock.updateAccountState({
                    balance: '4468000000000000000000',
                    transactions: [ETH_UNSTAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '100000000000000000000',
                            pendingDepositedBalance: '200000000000000000000',
                            depositedBalance: '0',
                            withdrawTotalAmount: '0', // Decreases by 3234
                            claimableAmount: '0', // Decreases by 3234
                            restakedReward: '0',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await devicePrompt.sendButton.click();
                await expect(stakingSection.claimedToastAccount).toContainText('Ethereum #1');
                await expect(stakingSection.claimedToastAmount).toContainText('3234 ETH');
                await expect(stakingSection.claimCard).toBeHidden();
                await expect(walletPage.balanceOfAccount({ symbol: 'eth', atIndex: 0 })).toHaveText(
                    '4,468',
                );
            });
        },
    );
});
