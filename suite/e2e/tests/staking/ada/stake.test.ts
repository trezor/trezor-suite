import {
    CARDANO_STAKING_REGISTRATION_DEPOSIT,
    EVERSTAKE_POOLS,
} from '@suite-common/wallet-constants';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { toADA } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';
import { ADA_MOCKED_ACCOUNT } from '../../../support/mocks/ada-endpoints';

// mocked and expected values
const startingBalance = Number(ADA_MOCKED_ACCOUNT.balance);
const startingBalanceFormatted = toADA(startingBalance);
const feeAmount = 177601; // mocked 44 lovelace/byte
const finalBalance =
    startingBalance - feeAmount - Number(CARDANO_STAKING_REGISTRATION_DEPOSIT) * 1_000_000;
const finalBalanceFormatted = toADA(finalBalance);

test.describe('Staking - Cardano', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Enable Cardano and set mocked backend', async () => {
                await settingsPage.navigateTo('coins');
                await blockbookMock.start('ada', 'blockfrost');

                await settingsPage.coinsTab.disableNetwork('btc');
                await settingsPage.coinsTab.enableNetwork('ada');
                await settingsPage.coinsTab.openNetworkAdvanceSettings('ada');
                await settingsPage.coinsTab.changeBackend('blockfrost', blockbookMock.url);

                await dashboardPage.dashboardMenuButton.click();
                await page.discoveryShouldFinish();
            });
        },
    );

    test(
        'Stake Cardano',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can stake from his Cardano account.',
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

            await test.step('Verify inactive staking account', async () => {
                await page.clock.install();
                await walletPage.openAccount({ symbol: 'ada', type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await expect(walletPage.discoveryWarning).toBeHidden();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    startingBalanceFormatted,
                );
                await expect(stakingSection.claimRewardsButton).toBeHidden();
                await expect(stakingSection.unstakeToClaimButton).toBeHidden();
                await expect(stakingAccountItemInLeftSection).toBeHidden();
            });

            await test.step('Initiate staking flow', async () => {
                await stakingSection.startStakingButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKING_IN_A_NUTSHELL');
                await expect(page.modal).toContainTranslation(
                    'TR_EARN_YOUR_FUNDS_STAY_ACCESSIBLE',
                    {
                        values: { networkDisplaySymbol: 'ADA' },
                    },
                );

                await stakingSection.continueButton.click();
                await expect(page.modalHeader).toHaveTranslation('TR_EARN_STAKE_TOKEN', {
                    values: { symbol: 'ADA' },
                });
                await stakingSection.everstakeAcknowledgeCheckbox.click();
                await stakingSection.confirmButton.click();
                await expect(stakingSection.cardanoDepositAmount).toHaveText(
                    `${CARDANO_STAKING_REGISTRATION_DEPOSIT} ADA`,
                );
                await expect(feeSection.maxFeeWithSymbol).toHaveText(
                    toADA(feeAmount, { maxDecimals: 4 }),
                );
            });

            await test.step('Confirm staking on device', async () => {
                const everstakePoolWrapped = EVERSTAKE_POOLS.map(pool => device.wrapText(pool));
                const everstakePoolBodyItem = everstakePoolWrapped[0].map((element, i) =>
                    element === '\n'
                        ? '\n'
                        : new RegExp(everstakePoolWrapped.map(wrapped => wrapped[i]).join('|')),
                );

                await stakingSection.continueButton.click();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Confirm'],
                            ['Stake key', '\n', 'registration'],
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
                            ['Confirm'],
                            ['Stake', '\n', 'delegation'],
                            ['For account #1'],
                            ["m/1852'/1815'/", '\n', "0'/2/0"],
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            ['Confirm'],
                            ['Stake delegation'],
                            ['For account #1'],
                            ["m/1852'/1815'/0'/2", '\n', '/0'],
                        ],
                    },
                });

                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [['To pool'], everstakePoolBodyItem],
                        actions: { right_button: 'Confirm' },
                    },
                });

                const poolDisplayContent = await device.getDisplayContent();
                const actualPool = poolDisplayContent.body
                    .map(paragraph => paragraph.join('').replace(/\n/g, ''))
                    .find(text => EVERSTAKE_POOLS.includes(text));
                if (!actualPool) {
                    throw new Error('Could not find Everstake pool in display content');
                }

                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Confirm'],
                            ['Vote', '\n', 'delegation'],
                            ['For account #1'],
                            ["m/1852'/1815'/", '\n', "0'/2/0"],
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            ['Confirm'],
                            ['Vote delegation'],
                            ['For account #1'],
                            ["m/1852'/1815'/0'/2", '\n', '/0'],
                        ],
                    },
                });

                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm transaction' },
                        body: [
                            ['Delegating to key hash'],
                            device.wrapText(
                                'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs',
                            ),
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

                // staked account
                blockbookMock.updateAccountState({
                    balance: finalBalance.toString(),
                    availableBalance: finalBalance.toString(),
                    misc: {
                        staking: {
                            address: 'stake1uytalm0k75njyj7v8z580ajs09v5v4lz6yp9akh8cgty43qunjqys',
                            rewards: '0',
                            isActive: true,
                            poolId: actualPool,
                            drep: {
                                drep_id: 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs',
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
                await expect(stakingSection.stakedToastAccount).toContainText('Cardano #1');
                await expect(stakingSection.stakedToastAmount).toContainText(finalBalanceFormatted);
            });

            await test.step('Verify account is staked', async () => {
                await page.clock.fastForward(stakingSection.watchPeriod);
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(
                    finalBalanceFormatted,
                );
                await expect(stakingSection.cardanoRewardAmount).toHaveText('0 ADA');
                await expect(stakingSection.claimRewardsButton).toBeDisabled();
                await expect(stakingSection.unstakeToClaimButton).toBeEnabled();
                await expect(stakingAccountItemInLeftSection).toBeVisible();
                await expect(stakingSection.cardanoStakedFullBalanceText).toHaveTranslation(
                    'TR_STAKE_FULL_BALANCE',
                );
            });
        },
    );
});
