import { paletteV1 } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import ETH_STAKE_PENDING_TX from '../../fixtures/staking/eth-stake-pending-tx.json';
import { TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../support/testExtends/customMatchers';

test.describe('ETH staking', { tag: ['@group=staking'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
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
        'stake on ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake from his Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, stakingSection, devicePrompt, blockbookMock }) => {
            await test.step('Check staking dashboard', async () => {
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.pendingAmount).toHaveText('3,000');
                await expect(stakingSection.stakedAmount).toHaveText('3,000');
                await expect(stakingSection.rewardsAmount).toHaveText('1,234');
                await expect(stakingSection.unstakingAmount).toHaveText('4,000');
            });

            await test.step('Open and fill staking form', async () => {
                await stakingSection.stakeMoreButton.click();
                await expect(
                    page.getByTestId('@staking/available-balance-with-symbol'),
                ).toContainText('1,234 ETH');
                await stakingSection.cryptoInput.fill('0.100204158497493752');
            });

            await test.step('Initiate staking and confirm on device', async () => {
                // await page.pause();
                await stakingSection.continueButton.click();
                await stakingSection.acknowledgeCheckbox.click();
                await stakingSection.confirmAndStakeButton.click();

                await expect(devicePrompt.outputValueOf('data')).toHaveText(
                    'Stake ETH on Everstake?',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [['Stake ETH on', '\n', 'Everstake?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.outputValueOf('amount')).toHaveText(
                    '0.100204158497493752 ETH',
                );
                await expect(devicePrompt.outputValueOf('fee')).toHaveText('0.000290278609719 ETH');

                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Stake' },
                    body: [
                        ['Amount'],
                        splitStringByDisplayLimit('0.100204158497493752 ETH'),
                        [' '],
                        ['Maximum fee'],
                        splitStringByDisplayLimit('0.000290278609719 ETH'),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Stake', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_STAKE_PENDING_TX, ETH_BASE_TX],
                    unconfirmedTxs: 1,
                    txs: 2,
                    nonTokenTxs: 2,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '999899795841502506248',
                            pendingDepositedBalance: '2000100204158497493752',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '1234000000000000000000',
                            autocompoundBalance: '7000000000000000000000',
                        },
                    ],
                    nonce: '2',
                });
                await devicePrompt.sendButton.click();
            });

            //TODO: Solve errors and remove following step
            await test.step('Navigate back to Dashboard', async () => {
                await devicePrompt.modalCloseButton.click({ timeout: 10_000 });
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
            });

            await test.step('Verify pending transaction', async () => {
                await expect(stakingSection.pendingTransactionText).toBeVisible();
                await expect(stakingSection.transactionStatus).toHaveText('Confirming transaction');
                await expect(stakingSection.transactionStatusContainer).toHaveCSS(
                    'background-color',
                    hexToRgba(paletteV1.lightAccentYellow300),
                );
                await expect(stakingSection.addingToPoolStatusContainer).toHaveCSS(
                    'background-color',
                    hexToRgba(paletteV1.lightGray100),
                );
                await expect(stakingSection.speedUpButton).toBeEnabled();
                await expect(stakingSection.pendingAmount).toHaveText('3,000');
                await expect(stakingSection.stakedAmount).toHaveText('3,000');
            });

            await test.step('Wait for transaction confirmation', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '999899795841502506248',
                            pendingDepositedBalance: '2000000000000000000000',
                            depositedBalance: '3000100204158497493752',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '1234000000000000000000',
                            autocompoundBalance: '7000000000000000000000',
                        },
                    ],
                });
                await page.reload();
                await expect(stakingSection.pendingAmount).toBeVisible({ timeout: 15_000 });
                await expect(stakingSection.transactionStatus).toHaveText('Transaction confirmed');
                await expect(stakingSection.transactionStatusContainer).toHaveCSS(
                    'background-color',
                    hexToRgba(paletteV1.lightPrimaryForest200),
                );
                await expect(stakingSection.addingToPoolStatusContainer).toHaveCSS(
                    'background-color',
                    hexToRgba(paletteV1.lightAccentYellow300),
                );
                await expect(stakingSection.pendingAmount).toHaveText('2,999.899795841502506248');
                await expect(stakingSection.stakedAmount).toHaveText('3,000.100204158497493752');
                await expect(stakingSection.pendingTransactionText).toBeHidden();
                await expect(stakingSection.speedUpButton).toBeHidden();
            });

            // TODO: How to move it to next phase, where it start generatin rewards
        },
    );
});
