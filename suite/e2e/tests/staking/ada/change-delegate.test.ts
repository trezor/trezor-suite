import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { toADA } from '../../../support/common';
import { expect, test } from '../../../support/fixtures';
import { ADA_MOCKED_ACCOUNT } from '../../../support/mocks/ada-endpoints';

const adaSymbol = asNetworkSymbol('ada');

const balance = Number(ADA_MOCKED_ACCOUNT.balance);
const feeAmount = 171969;
const finalBalance = balance - feeAmount;

const stakedWithEverstakeDrep = {
    ...ADA_MOCKED_ACCOUNT.misc.staking,
    isActive: true,
    poolId: 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
    drep: {
        drep_id: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
        hex: '22ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
        amount: balance.toString(),
        active: true,
        active_epoch: 573,
        has_script: false,
        retired: false,
        expired: false,
        last_active_epoch: 601,
    },
};

const voteDelegationScreen = {
    header: { title: 'Confirm transaction' },
    body: [
        ['Confirm'],
        ['Vote', '\n', 'delegation'],
        ['For account #1'],
        ["m/1852'/1815'/", '\n', "0'/2/0"],
        ['Delegating to'],
        ['Always Abstain'],
    ],
    actions: { right_button: 'Confirm' },
};

test.describe('Staking - Cardano', { tag: ['@T3W1', '@T3T1', '@optional', '@webOnly'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();

        await test.step('Enable Cardano and set mocked backend', async () => {
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('ada', 'blockfrost');
            blockbookMock.updateAccountState({ misc: { staking: stakedWithEverstakeDrep } });

            await settingsPage.changeNetworks({
                enableNetworks: [
                    { symbol: adaSymbol, backend: { type: 'blockfrost', url: blockbookMock.url } },
                ],
            });
        });
    });

    test(
        'Change Cardano voting delegate',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can change the DRep delegate of his staked Cardano account.',
                category: TestCategory.Staking,
                priority: TestPriority.Medium,
                stream: TestStream.Earn,
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
            await test.step('Open change delegate modal', async () => {
                await walletPage.openAccount({ symbol: adaSymbol, type: 'normal', atIndex: 0 });
                await stakingSection.stakingTabButton.click();
                await stakingSection.changeDelegateButton.click();
                await expect(page.modalHeader).toHaveTranslation(
                    'TR_STAKING_CHANGE_VOTING_PREFERENCE',
                );
                await expect(stakingSection.votingPreferenceOptionLabels).toHaveTranslation([
                    'TR_STAKING_VOTE_ABSTAIN',
                    'TR_STAKING_VOTE_CHOOSE_OWN_DREP',
                ]);
                await expect(stakingSection.continueButton).toBeDisabled();
            });

            await test.step('Select abstain as the new delegate', async () => {
                await stakingSection.votingPreferenceOption('abstain').click();
                await expect(feeSection.maxFeeWithSymbol).toHaveText(
                    toADA(feeAmount, { maxDecimals: 4 }),
                );
                await stakingSection.continueButton.click();
            });

            await test.step('Confirm vote delegation on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: voteDelegationScreen,
                    T3T1: {
                        body: [
                            ['Confirm'],
                            ['Vote delegation'],
                            ['For account #1'],
                            ["m/1852'/1815'/0'/2", '\n', '/0'],
                        ],
                    },
                });

                if (device.model === Model.T3T1) {
                    await devicePrompt.waitForPromptAndClick();
                }

                await expect(device).toShowOnDisplay({
                    T3W1: voteDelegationScreen,
                    T3T1: {
                        body: [['Delegating to'], ['Always Abstain']],
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

                blockbookMock.updateAccountState({
                    availableBalance: finalBalance.toString(),
                    balance: finalBalance.toString(),
                    misc: {
                        staking: {
                            ...stakedWithEverstakeDrep,
                            drep: {
                                ...stakedWithEverstakeDrep.drep,
                                drep_id: 'drep_always_abstain',
                                hex: '',
                                amount: finalBalance.toString(),
                            },
                        },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify delegate change is broadcast', async () => {
                await stakingSection.verifyStakingToast({ type: 'voted' });
                await expect(page.modal).toBeHidden();
                await expect(walletPage.topPanelBalanceWithSymbol).toHaveText(toADA(finalBalance));
            });

            await test.step('Verify abstain is the current delegate', async () => {
                await stakingSection.changeDelegateButton.click();
                await expect(stakingSection.votingPreferenceOptionLabels).toHaveTranslation([
                    'TR_STAKING_VOTE_LET_EVERSTAKE_VOTE',
                    'TR_STAKING_VOTE_CHOOSE_OWN_DREP',
                ]);
            });
        },
    );
});
