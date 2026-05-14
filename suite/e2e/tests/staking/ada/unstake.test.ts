import { CARDANO_STAKING_REGISTRATION_DEPOSIT } from '@suite-common/wallet-constants';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { toADA } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';

// mocked and expected values
const startingBalance = 86858306;
const startingBalanceFormatted = toADA(startingBalance);
const feeAmount = 171881;
const unstakedAmountFormatted = toADA(startingBalance - feeAmount);
const finalBalance =
    startingBalance - feeAmount + Number(CARDANO_STAKING_REGISTRATION_DEPOSIT) * 1_000_000;
const finalBalanceFormatted = toADA(finalBalance);

test.describe('Staking - Cardano', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Enable Cardano and set mocked backend', async () => {
                await settingsPage.navigateTo('coins');
                await blockbookMock.start('ada', 'blockfrost');
                // staked account
                blockbookMock.updateAccountState({
                    availableBalance: startingBalance.toString(),
                    balance: startingBalance.toString(),
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
        'Unstake Cardano',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake his Cardano account.',
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
            await test.step('Verify staked account', async () => {
                await walletPage.openAccount({ symbol: 'ada', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(walletPage.discoveryWarning).toBeHidden();
                await expect(stakingSection.claimRewardsButton).toBeDisabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingSection.startStakingButton).toBeHidden();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    startingBalanceFormatted,
                );
                await expect(stakingSection.cardanoRewardAmount).toHaveText('0 ADA');
                await expect(stakingSection.cardanoStakedFullBalanceText).toHaveTranslation(
                    'TR_STAKE_FULL_BALANCE',
                );
            });

            await test.step('Initiate unstaking', async () => {
                await stakingSection.unstakeToClaimButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_STAKE_UNSTAKE_TOKEN', {
                    values: { symbol: 'ADA' },
                });
                await expect(feeSection.maxFeeWithSymbol).toHaveText(
                    toADA(feeAmount, { maxDecimals: 4 }),
                );
                await stakingSection.unstakeButton.click();
            });

            await test.step('Confirm claim on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Confirm'],
                            ['Stake key', '\n', 'deregistration'],
                            ['For account #1'],
                            device.wrapText("m/1852'/1815'/0'/2/0"),
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
                            [toADA(feeAmount)],
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
                            [toADA(feeAmount)],
                            ['Network'],
                            ['Mainnet'],
                            ['Valid since'],
                            ['n/a'],
                        ],
                    },
                });

                // unstaked account
                blockbookMock.updateAccountState({
                    availableBalance: finalBalance,
                    balance: finalBalance,
                    misc: {
                        staking: {
                            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            rewards: '0',
                            isActive: false,
                            poolId: null,
                            drep: null,
                        },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify unstaked account', async () => {
                await expect(stakingSection.unstakedToastAccount).toContainText('Cardano #1');
                await expect(stakingSection.unstakedToastAmount).toContainText(
                    unstakedAmountFormatted,
                );
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    finalBalanceFormatted,
                );
                await expect(stakingSection.startStakingButton).toBeEnabled();
                await expect(stakingSection.claimRewardsButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
                await expect(stakingAccountItemInLeftSection).toBeHidden();
                await expect(stakingSection.cardanoRewardAmount).toBeHidden();
                await expect(stakingSection.cardanoStakedFullBalanceText).toBeHidden();
            });
        },
    );
});
