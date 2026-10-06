import type { StakingBatch } from '@suite-common/earn-staking-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
    CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
} from '@suite-common/wallet-constants';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { ADA_MOCKED_ACCOUNT } from '../../../support/mocks/ada-endpoints';

const adaSymbol = asNetworkSymbol('ada');
// EVE7 pool
const everstakePoolId = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';
const everstakePoolApy = 3.9;
// Retired FiveBinaries pool
const fiveBinariesPoolId = 'pool1nhhsh9yhlrvj9e3nce0zpx0xm2xlt6tx7gqakhr6hjc8wy84sat';
const updateProviderFeeFormatted = '0.1748 ADA';

test.describe(
    'Staking - Cardano outdated provider',
    { tag: ['@T3W1', '@T3T1', '@webOnly'] },
    () => {
        test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

        test.beforeEach(async ({ page, onboardingPage, settingsPage, blockbookMock }) => {
            await test.step('Mock Everstake Cardano pool stats', async () => {
                await page.route(/\/staking\/v1\/\?networks=/, route =>
                    route.fulfill({
                        json: {
                            data: [
                                {
                                    symbol: 'ada',
                                    pools: [
                                        {
                                            apy: everstakePoolApy,
                                            saturation: 50,
                                            id: everstakePoolId,
                                        },
                                    ],
                                },
                            ],
                            errors: [],
                        } satisfies StakingBatch,
                    }),
                );
            });

            await onboardingPage.completeOnboarding();

            await test.step('Enable Cardano with account staked to a FiveBinaries pool', async () => {
                await settingsPage.navigateTo('coins');
                await blockbookMock.start('ada', 'blockfrost');
                blockbookMock.updateAccountState({
                    misc: {
                        staking: {
                            ...ADA_MOCKED_ACCOUNT.misc.staking,
                            isActive: true,
                            poolId: fiveBinariesPoolId,
                        },
                    },
                });

                await settingsPage.changeNetworks({
                    enableNetworks: [
                        {
                            symbol: adaSymbol,
                            backend: { type: 'blockfrost', url: blockbookMock.url },
                        },
                    ],
                });
            });
        });

        test(
            'User staked with FiveBinaries is warned to update provider',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Verifies that a Cardano account delegated to a FiveBinaries pool shows the outdated provider warnings.',
                    category: TestCategory.Staking,
                    priority: TestPriority.Medium,
                    stream: TestStream.Earn,
                }),
            },
            async ({ page, walletPage, stakingSection, earnNutshellModal, feeSection }) => {
                await test.step('Verify global outdated staking banner', async () => {
                    await expect(stakingSection.cardanoOutdatedBanner).toContainTranslation(
                        'TR_STAKING_MODAL_OUTDATED',
                        { values: { apy: everstakePoolApy } },
                    );
                    await expect(
                        stakingSection.cardanoOutdatedBannerUpdateProviderButton,
                    ).toHaveTranslation('TR_STAKING_MODAL_OUTDATED_BUTTON');
                });

                await test.step('Verify "No rewards" label in account menu', async () => {
                    await expect(
                        walletPage.stakingRewardsReducedLabel({
                            symbol: adaSymbol,
                            subAccount: 'staking',
                        }),
                    ).toHaveTranslation('TR_STAKING_REWARDS_REDUCED');
                });

                await test.step('Verify outdated provider card on Staking tab', async () => {
                    await walletPage.openAccount({ symbol: adaSymbol });
                    await stakingSection.stakingTabButton.click();
                    await expect(stakingSection.stakingDashboardCard).toBeVisible();
                    await expect(stakingSection.newProviderCard).toContainTranslation(
                        'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE',
                    );
                    await expect(stakingSection.newProviderCard).toContainTranslation(
                        'TR_STAKING_NEW_PROVIDER_OUTDATED_TEXT',
                        { values: { apy: everstakePoolApy, displaySymbol: 'ADA' } },
                    );
                    await expect(
                        stakingSection.newProviderCardUpdateProviderButton,
                    ).toHaveTranslation('TR_EARN_UPDATE_PROVIDER');
                    await expect(stakingSection.startStakingButton).toBeHidden();
                });

                await test.step('Card button opens update provider modal', async () => {
                    await stakingSection.newProviderCardUpdateProviderButton.click();
                    await expect(earnNutshellModal.heading).toHaveTranslation(
                        'TR_EARN_STAKING_IN_A_NUTSHELL',
                    );
                    await expect(earnNutshellModal.updateProviderProcess).toContainTranslation(
                        'TR_EARN_PROVIDER_UPDATE',
                    );
                    await earnNutshellModal.continueButton.click();
                });

                await test.step('Consent to stake with Everstake', async () => {
                    await expect(page.modalHeader).toHaveTranslation('TR_EARN_UPDATE_PROVIDER');
                    await expect(stakingSection.everstakeAcknowledgeCheckbox).toHaveTranslation(
                        'TR_EARN_CONSENT_TO_STAKING_WITH_PROVIDER',
                        { values: { providerName: 'Everstake' } },
                    );
                    await stakingSection.everstakeAcknowledgeCheckbox.click();
                    await stakingSection.confirmButton.click();
                });

                await test.step('Verify update provider stake modal', async () => {
                    await expect(page.modalHeader).toHaveTranslation('TR_EARN_UPDATE_PROVIDER');
                    await expect(stakingSection.stakeModalAmount).toHaveTranslation(
                        'TR_STAKE_FULL_BALANCE',
                    );
                    await expect(stakingSection.stakeModalNewProvider).toHaveText('Everstake');
                    await expect(stakingSection.stakeModalFundsBanner).toHaveTranslation(
                        'TR_STAKING_REWARDS_REMAIN_INTACT',
                    );
                    await expect(stakingSection.votingPreferenceHeading).toHaveTranslation(
                        'TR_STAKING_WHO_VOTES_WITH_YOUR_FUNDS',
                        { values: { displaySymbol: 'ADA' } },
                    );
                    await expect(stakingSection.votingPreferenceOptionLabels).toHaveTranslation([
                        'TR_STAKING_VOTE_ABSTAIN',
                        'TR_STAKING_VOTE_LET_EVERSTAKE_VOTE',
                        'TR_STAKING_VOTE_CHOOSE_OWN_DREP',
                    ]);
                    await expect(stakingSection.stakeModalInfoCardHeadings).toHaveTranslation([
                        'TR_STAKING_ONCE_YOU_CONFIRM',
                        'TR_STAKING_ESTIMATED_GAINS',
                    ]);
                    await expect(stakingSection.stakeModalInfoRowContents).toHaveTranslation(
                        [
                            'TR_TRADING_NETWORK_FEE',
                            'TR_EARN_APPROXIMATE_DAYS_RANGE',
                            'TR_EARN_APY_APPROX',
                        ],
                        {
                            values: {
                                minDays: CARDANO_ACTIVATION_PERIOD_MIN_DAYS,
                                maxDays: CARDANO_ACTIVATION_PERIOD_MAX_DAYS,
                                apyPercent: everstakePoolApy,
                            },
                        },
                    );
                    await expect(stakingSection.stakeModalInfoRowSubheadings).toHaveTranslation([
                        'TR_EARN_TIME_TO_START_EARNING',
                        'TR_EARN_REWARDS_ARE_RESTAKED',
                    ]);
                    await expect(feeSection.maxFeeWithSymbol).toHaveText(
                        updateProviderFeeFormatted,
                    );
                    await expect(stakingSection.continueButton).toBeEnabled();
                    await page.modalCloseButton.click();
                    await expect(page.modal).toBeHidden();
                });

                await test.step('Banner button navigates to Earn', async () => {
                    await stakingSection.cardanoOutdatedBannerUpdateProviderButton.click();
                    await expect(
                        stakingSection.earnDashboardUpdateProviderButton,
                    ).toHaveTranslation('TR_EARN_UPDATE_PROVIDER');
                });

                await test.step('Earn button navigates to account Staking tab', async () => {
                    await stakingSection.earnDashboardUpdateProviderButton.click();
                    await expect(stakingSection.stakingDashboardCard).toBeVisible();
                    await expect(stakingSection.newProviderCard).toContainTranslation(
                        'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE',
                    );
                });
            },
        );
    },
);
