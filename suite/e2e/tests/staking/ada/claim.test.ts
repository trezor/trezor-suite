import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { toADA } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';

// mocked and expected values
const startingBalance = 88858306;
const startingBalanceFormatted = toADA(startingBalance);
const smallRewardFee = 171700; // mocked 44 lovelace/byte
const tooSmallRewardAmount = 56398; // lower than fee 171700
const tooSmallRewardAmountFormatted = toADA(tooSmallRewardAmount);
const bigRewardFee = 171837; // mocked 44 lovelace/byte
const bigRewardAmount = 2636772; // bigger than fee 171837
const bigRewardAmountFormatted = toADA(bigRewardAmount);
const finalBalance = startingBalance + bigRewardAmount - bigRewardFee;
const finalBalanceFormatted = toADA(finalBalance);

test.describe('Staking - Cardano', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Enable Cardano and set mocked backend', async () => {
                await settingsPage.navigateTo('coins');
                await blockbookMock.start('ada', 'blockfrost');
                // staked account with too small rewards for claiming
                blockbookMock.updateAccountState({
                    availableBalance: startingBalance.toString(),
                    balance: (startingBalance + tooSmallRewardAmount).toString(),
                    misc: {
                        staking: {
                            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            rewards: tooSmallRewardAmount.toString(),
                            isActive: true,
                            poolId: 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
                            drep: {
                                drep_id:
                                    'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
                                hex: '22ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
                                amount: startingBalance.toString(),
                                active: true,
                                active_epoch: 573,
                                has_script: false,
                                retired: false,
                                expired: false,
                                last_active_epoch: 601,
                            },
                        },
                    },
                });

                await settingsPage.coinsTab.enableNetwork('ada');
                await settingsPage.coinsTab.openNetworkAdvanceSettings('ada');
                await settingsPage.coinsTab.changeBackend('blockfrost', blockbookMock.url);

                await dashboardPage.dashboardMenuButton.click();
                await page.discoveryShouldFinish();
            });
        },
    );

    test(
        'Claim rewards from Cardano staking',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can claim stake rewards to his Cardano account.',
                category: TestCategory.Staking,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({
            page,
            device,
            devicePrompt,
            walletPage,
            feeSection,
            stakingSection,
            blockbookMock,
        }) => {
            const stakingAccountItemInLeftSection = walletPage.accountButton({
                symbol: 'ada',
                type: 'normal',
                atIndex: 0,
                subAccount: 'staking',
            });
            await test.step('Verify staked account with rewards', async () => {
                await page.clock.install();
                await expect(stakingAccountItemInLeftSection).toBeVisible();
                await walletPage.openAccount({ symbol: 'ada', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(walletPage.discoveryWarning).toBeHidden();
                await expect(stakingSection.claimRewardsButton).toBeEnabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.startStakingButton).toBeHidden();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    startingBalanceFormatted,
                );
                await expect(stakingSection.cardanoRewardAmount).toHaveText(
                    tooSmallRewardAmountFormatted,
                );
                await expect(stakingSection.cardanoStakedFullBalanceText).toHaveTranslation(
                    'TR_STAKE_FULL_BALANCE',
                );
            });

            await test.step('Verify warning on too small reward claim', async () => {
                await stakingSection.claimRewardsButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_CLAIM_REWARDS');
                await expect(stakingSection.claimWarningBanner).toHaveTranslation(
                    'TR_STAKING_REWARDS_NETWORK_FEE_WARNING',
                );
                await expect(stakingSection.cardanoModalRewardAmount).toHaveText(
                    tooSmallRewardAmountFormatted,
                );
                await expect(feeSection.maxFeeWithSymbol).toHaveText(toADA(smallRewardFee));
                await page.modalCloseButton.click();
            });

            await test.step('Increase reward amount', async () => {
                // staked account with big enough rewards for claiming
                blockbookMock.updateAccountState({
                    availableBalance: startingBalance.toString(),
                    balance: (startingBalance + bigRewardAmount).toString(),
                    misc: {
                        staking: {
                            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            rewards: bigRewardAmount.toString(),
                            isActive: true,
                            poolId: 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
                            drep: {
                                drep_id:
                                    'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
                                hex: '22ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
                                amount: startingBalance.toString(),
                                active: true,
                                active_epoch: 573,
                                has_script: false,
                                retired: false,
                                expired: false,
                                last_active_epoch: 601,
                            },
                        },
                    },
                });
                await page.clock.fastForward(stakingSection.watchPeriod);
                // navigate away and back to refresh rewards
                await walletPage.overviewTabButton.click();
                await stakingSection.stakingTabButton.click();
                await expect(stakingSection.cardanoRewardAmount).toHaveText(
                    bigRewardAmountFormatted,
                );
            });

            await test.step('Initiate reward claim with big enough reward', async () => {
                await stakingSection.claimRewardsButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_CLAIM_REWARDS');
                await expect(stakingSection.claimWarningBanner).toBeHidden();
                await expect(stakingSection.cardanoModalRewardAmount).toHaveText(
                    bigRewardAmountFormatted,
                );
                await expect(feeSection.maxFeeWithSymbol).toHaveText(
                    toADA(bigRewardFee, { maxDecimals: 4 }),
                );
                await stakingSection.claimModalButton.click();
            });

            await test.step('Confirm claim on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Confirm withdrawal for Reward', '\n', 'address'],
                            device.wrapText(
                                'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            ),
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            ['Confirm withdrawal for', '\n', 'Reward address'],
                            device.wrapText(
                                'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            ),
                        ],
                    },
                });

                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['For account #1'],
                            device.wrapText("m/1852'/1815'/0'/2/0"),
                            ['Amount'],
                            [bigRewardAmountFormatted],
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                });

                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Transaction fee'],
                            [toADA(bigRewardFee)],
                            ['Network'],
                            ['Mainnet'],
                            ['Valid since'],
                            ['n/a'],
                            ['TTL'],
                            [/\d{9}$/],
                        ],
                        actions: { right_button: 'Hold to confirm' },
                    },
                    T3T1: {
                        body: [
                            ['Transaction fee'],
                            [toADA(bigRewardFee)],
                            ['Network'],
                            ['Mainnet'],
                            ['Valid since'],
                            ['n/a'],
                        ],
                    },
                });

                // staked account without rewards after claiming
                blockbookMock.updateAccountState({
                    availableBalance: finalBalance.toString(),
                    balance: finalBalance.toString(),
                    misc: {
                        staking: {
                            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            rewards: '0',
                            isActive: true,
                            poolId: 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
                            drep: {
                                drep_id:
                                    'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
                                hex: '22ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
                                amount: finalBalance.toString(),
                                active: true,
                                active_epoch: 573,
                                has_script: false,
                                retired: false,
                                expired: false,
                                last_active_epoch: 601,
                            },
                        },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify claimed and staked account', async () => {
                await expect(stakingSection.claimedToastAccount).toContainText('Cardano #1');
                await expect(stakingSection.claimedToastAmount).toContainText(
                    bigRewardAmountFormatted,
                );
                await expect(stakingSection.claimRewardsButton).toBeDisabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.startStakingButton).toBeHidden();
                await expect(stakingAccountItemInLeftSection).toBeVisible();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    finalBalanceFormatted,
                );
                await expect(stakingSection.cardanoRewardAmount).toHaveText('0 ADA');
                await expect(stakingSection.cardanoStakedFullBalanceText).toHaveTranslation(
                    'TR_STAKE_FULL_BALANCE',
                );
            });
        },
    );
});
