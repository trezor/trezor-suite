import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_UNSTAKE_CONFIRMED_TX from '../../fixtures/staking/eth-unstake-confirmed-tx.json';
import ETH_UNSTAKE_PENDING_TX from '../../fixtures/staking/eth-unstake-pending-tx.json';
import { skipFixture } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../support/testExtends/customMatchers';

test.describe('ETH unstaking', { tag: ['@group=staking'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
        //TODO: Remove once test is fixed
        exceptionLogger: skipFixture,
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coins.disableNetwork('btc');
            await settingsPage.coins.enableNetwork('eth');
            await settingsPage.coins.openNetworkAdvanceSettings('eth');
            await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'unstake from ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake his Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, stakingSection, devicePrompt, blockbookMock }) => {
            await test.step('Check staking dashboard', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.expectStakingAmounts({
                    pending: '3,000',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: '4,000',
                });
            });

            await test.step('Open unstaking form', async () => {
                await stakingSection.unstakeToClaimButton.click();
                await expect(stakingSection.availableBalanceWithSymbol).toHaveText('7,000 ETH');
                await expect(stakingSection.cryptoInput).toHaveValue('7,000');
            });

            await test.step('Initiate unstaking and confirm on device', async () => {
                await stakingSection.unstakeButton.click();
                await expect(devicePrompt.outputValueOf('data')).toHaveText(
                    'Unstake ETH from Everstake?',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [['Unstake ETH from', '\n', 'Everstake?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.outputValueOf('amount')).toHaveText('7,000 ETH');
                await expect(devicePrompt.outputValueOf('fee')).toHaveText('0.000290278609719 ETH');
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [
                        ['Amount'],
                        [`7,000 ETH`],
                        [' '],
                        ['Maximum fee'],
                        splitStringByDisplayLimit('0.000290278609719 ETH'),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Unstake', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_UNSTAKE_PENDING_TX, ETH_BASE_TX],
                    unconfirmedTxs: 1,
                    txs: 2,
                    nonTokenTxs: 2,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '1000000000000000000000',
                            pendingDepositedBalance: '2000000000000000000000',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '0', // Lowers by 7000
                        },
                    ],
                    nonce: '2',
                });
                await devicePrompt.sendButton.click();
            });

            await test.step('Verify pending transaction and not being able to unstake more', async () => {
                await expect(stakingSection.pendingTransactionText).toBeVisible();
                await expect(stakingSection.speedUpButton).toBeEnabled();
                await stakingSection.expectStakingAmounts({
                    pending: '3,000',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: '4,000',
                });
                await expect(stakingSection.unstakeToClaimButton).toBeDisabled();
            });

            await test.step('Wait for transaction confirmation', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_UNSTAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '1000000000000000000000',
                            pendingDepositedBalance: '2000000000000000000000',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '11000000000000000000000', // Increases by 7000
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '234000000000000000000',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                await stakingSection.expectStakingAmounts({
                    pending: '3,000',
                    staked: '3,000',
                    rewards: '234',
                    unstaking: '11,000',
                });
                await expect(stakingSection.pendingTransactionText).toBeHidden();
                await expect(stakingSection.speedUpButton).toBeHidden();
            });
        },
    );
});
