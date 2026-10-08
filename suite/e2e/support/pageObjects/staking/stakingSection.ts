import { Locator, Page } from '@playwright/test';

import { colorVariants } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { RewardsList } from './rewardList';
import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

type VerifyStakingToastParams = {
    type: 'staked' | 'unstaked' | 'claimed';
};

type ExpectStakingAmountsParams = {
    expected: {
        pending: string | 'hidden';
        staked: string | 'hidden';
        rewards: string | 'hidden';
        unstaking: string | 'hidden';
    };
    options?: { fastForward?: string; timeout?: number };
};

export class StakingSection {
    readonly rewardList: RewardsList;
    // Timers
    readonly watchPeriod = '01:00';
    readonly solanaEpochCachePeriod = '01:00:00';
    // Locators
    readonly stakingTabButton: Locator;
    readonly stakingDashboardCard: Locator;
    readonly stakingEmptyCard: Locator;
    readonly externalStakingCard: Locator;
    readonly rewardsWarningBanner: Locator;
    readonly pendingAmount: Locator;
    readonly stakedAmount: Locator;
    readonly rewardsAmount: Locator;
    readonly unstakingAmount: Locator;
    readonly unstakeToClaimButton: Locator;
    readonly availableBalanceWithSymbol: Locator;
    readonly cryptoInput: Locator;
    readonly cryptoInputFractionButtons: Locator;
    readonly fiatInput: Locator;
    readonly unstakeButton: Locator;
    readonly speedUpButton: Locator;
    readonly pendingTransactionText: Locator;
    readonly stakeMoreButton: Locator;
    readonly startStakingButton: Locator;
    readonly continueButton: Locator;
    readonly confirmButton: Locator;
    readonly acknowledgeCheckbox: Locator;
    readonly everstakeAcknowledgeCheckbox: Locator;
    readonly confirmAndStakeButton: Locator;
    readonly progressLabels: Locator;
    readonly transactionStatus: Locator;
    readonly transactionStatusContainer: Locator;
    readonly addingToPoolStatusContainer: Locator;
    readonly receivingRewardsContainer: Locator;
    readonly instantBanner: Locator;
    readonly instantBannerHeader: Locator;
    readonly instantBannerParagraph: Locator;
    readonly instantBannerGotItButton: Locator;
    readonly claimCard: Locator;
    readonly claimBalanceWithSymbol: Locator;
    readonly claimButton: Locator;
    readonly claimModalAmount: Locator;
    readonly claimModalButton: Locator;
    readonly fractionButton = (amount: '10%' | '25%' | '50%' | 'Max') =>
        this.page.getByRole('button', { name: amount });
    readonly cryptoInputBottomText: Locator;
    readonly switchInputs: Locator;
    readonly withdrawalWarning: Locator;
    readonly fiatTicker: Locator;
    readonly cryptoTicker: Locator;
    readonly stakedToast: Locator;
    readonly stakedToastMessage: Locator;
    readonly unstakedToast: Locator;
    readonly unstakedToastMessage: Locator;
    readonly claimedToast: Locator;
    readonly claimedToastMessage: Locator;
    readonly claimRewardsButton: Locator;
    readonly cardanoRewardAmount: Locator;
    readonly cardanoDepositAmount: Locator;
    readonly cardanoModalRewardAmount: Locator;
    readonly cardanoStakedFullBalanceText: Locator;
    readonly claimWarningBanner: Locator;

    constructor(private readonly page: Page) {
        this.rewardList = new RewardsList(page);
        this.stakingTabButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakingDashboardCard = this.page.getByTestId('@wallet/staking/card');
        this.stakingEmptyCard = this.page.getByTestId('@wallet/staking/empty-card');
        this.externalStakingCard = this.page.getByTestId('@wallet/staking/outside-staking-card');
        this.rewardsWarningBanner = this.page.getByTestId('@wallet/staking/rewards-warning');
        this.pendingAmount = this.page.getByTestId('@account/staking/pending');
        this.stakedAmount = this.page.getByTestId('@account/staking/staked');
        this.rewardsAmount = this.page.getByTestId('@account/staking/rewards');
        this.unstakingAmount = this.page.getByTestId('@account/staking/unstaking');
        this.unstakeToClaimButton = this.page.getByTestId('@account/staking/unstake-button');
        this.availableBalanceWithSymbol = this.page.getByTestId(
            '@staking/available-balance-with-symbol',
        );
        this.cryptoInput = this.page.getByTestId('@staking/form/crypto-input');
        this.cryptoInputFractionButtons = this.page.getByTestId('@staking/form/fraction-buttons');

        this.fiatInput = this.page.getByTestId('@staking/form/fiat-input');
        this.unstakeButton = this.page.getByTestId('@modal/staking/unstake-button');
        this.speedUpButton = this.page.getByTestId('@transaction-item/bump-fee-button');
        this.pendingTransactionText = this.page.getByTestId('@transaction-group/pending/count');
        this.stakeMoreButton = this.page.getByTestId('@account/staking/stake-more-button');
        this.startStakingButton = this.page.getByTestId(
            '@wallet/staking/empty-card/start-staking-button',
        );
        this.continueButton = this.page.getByTestId('@modal/staking/continue-button');
        this.confirmButton = this.page.getByTestId('@modal/staking/confirm-button');
        this.acknowledgeCheckbox = this.page.getByTestId('@staking/acknowledge-checkbox');
        this.everstakeAcknowledgeCheckbox = this.page.getByTestId(
            '@staking/provider-acknowledge-checkbox',
        );
        this.confirmAndStakeButton = this.page.getByTestId(
            '@modal/staking/confirm-and-stake-button',
        );
        this.progressLabels = this.page.getByTestId('@staking/progress-labels');
        this.transactionStatus = this.page.getByTestId('@staking/transaction-status');
        this.transactionStatusContainer = this.page.getByTestId(
            '@staking/transaction-status/container',
        );
        this.addingToPoolStatusContainer = this.page.getByTestId(
            '@staking/adding-to-pool-status/container',
        );
        this.receivingRewardsContainer = this.page.getByTestId('@staking/reward-status/container');
        this.instantBanner = this.page.getByTestId('@staking/instant-stake-banner');
        this.instantBannerHeader = this.page.getByTestId('@staking/instant-stake-banner/header');
        this.instantBannerParagraph = this.page.getByTestId(
            '@staking/instant-stake-banner/paragraph',
        );
        this.instantBannerGotItButton = this.page.getByTestId(
            '@staking/instant-stake-banner/got-it-button',
        );
        this.claimCard = this.page.getByTestId('@staking/can-claim-card');
        this.claimBalanceWithSymbol = this.page.getByTestId('@staking/can-claim-with-symbol');
        this.claimButton = this.page.getByTestId('@account/staking/claim-button');
        this.claimModalAmount = this.page.getByTestId('@staking/claim-modal/amount-with-symbol');
        this.claimModalButton = this.page.getByTestId('@staking/claim-modal/continue-button');
        this.cryptoInputBottomText = this.page.getByTestId(
            '@staking/form/crypto-input/bottom-text',
        );
        this.switchInputs = this.page.getByTestId('@staking/form/switch-inputs');
        this.withdrawalWarning = this.page.getByTestId('@staking/form/withdrawal-warning');
        this.fiatTicker = this.page.getByTestId('@staking/form/fiat-input/input-addon');
        this.cryptoTicker = this.page.getByTestId('@staking/form/crypto-input/input-addon');
        this.stakedToast = this.page.getByTestId('@toast/tx-staked');
        this.stakedToastMessage = this.page.getByTestId('@toast/tx-staked/message');
        this.unstakedToast = this.page.getByTestId('@toast/tx-unstaked');
        this.unstakedToastMessage = this.page.getByTestId('@toast/tx-unstaked/message');
        this.claimedToast = this.page.getByTestId('@toast/tx-claimed');
        this.claimedToastMessage = this.page.getByTestId('@toast/tx-claimed/message');
        this.claimRewardsButton = this.page.getByTestId('@account/staking/claim-rewards-button');
        this.cardanoRewardAmount = this.page.getByTestId('@account/staking/rewards-with-symbol');
        this.cardanoDepositAmount = this.page.getByTestId(
            '@modal/staking/registration-deposit-amount-with-symbol',
        );
        this.cardanoModalRewardAmount = this.page.getByTestId(
            '@modal/claim/rewards-amount-with-symbol',
        );
        this.cardanoStakedFullBalanceText = this.page.getByTestId('@account/staking/full-balance');
        this.claimWarningBanner = this.page.getByTestId('@modal/claim/fee-warning-banner');
    }

    @step()
    async verifyStakingToast({ type }: VerifyStakingToastParams) {
        const toasts = {
            staked: {
                messageLocator: this.stakedToastMessage,
                translationKey: 'TOAST_TX_STAKE_PENDING',
            },
            unstaked: {
                messageLocator: this.unstakedToastMessage,
                translationKey: 'TOAST_TX_UNSTAKE_PENDING',
            },
            claimed: {
                messageLocator: this.claimedToastMessage,
                translationKey: 'TOAST_TX_CLAIM_PENDING',
            },
        } as const;

        await expect(toasts[type].messageLocator).toHaveTranslation(toasts[type].translationKey);
    }

    @step()
    async expectExternalStakingCard({
        amount,
        displaySymbol,
    }: {
        amount: string;
        displaySymbol: string;
    }) {
        const fiatAmountRegex = /\$\d{1,3}(,\d{3})*\.\d{2}/;

        await expect(this.externalStakingCard).toContainTranslation(
            'TR_OUTSIDE_STAKING_CARD_TITLE',
        );
        await expect(this.externalStakingCard).toContainTranslation(
            'TR_OUTSIDE_STAKING_CARD_TEXT',
            {
                values: { amount, displaySymbol, fiat: fiatAmountRegex },
            },
        );
    }

    @step()
    async expectProgressIndicatorsToMatchPhase(
        phase: 'pendingTransaction' | 'addingToPool' | 'receivingRewards',
    ) {
        const colors = colorVariants.standard;
        const phaseIndicatorColors = {
            pendingTransaction: {
                transactionStep: colors.elementFillWarningSoft,
                addingStep: colors.surfaceFillSunken,
                rewardsStep: colors.surfaceFillSunken,
            },
            addingToPool: {
                transactionStep: colors.elementFillBrandSoft,
                addingStep: colors.elementFillWarningSoft,
                rewardsStep: colors.surfaceFillSunken,
            },
            receivingRewards: {
                transactionStep: colors.elementFillBrandSoft,
                addingStep: colors.elementFillBrandSoft,
                rewardsStep: colors.elementFillWarningSoft,
            },
        };
        const currentPhaseColors = phaseIndicatorColors[phase];

        await expect(this.transactionStatusContainer).toHaveCSS(
            'background-color',
            hexToRgba(currentPhaseColors.transactionStep),
        );
        await expect(this.addingToPoolStatusContainer).toHaveCSS(
            'background-color',
            hexToRgba(currentPhaseColors.addingStep),
        );
        await expect(this.receivingRewardsContainer).toHaveCSS(
            'background-color',
            hexToRgba(currentPhaseColors.rewardsStep),
        );
    }

    @step()
    async expectStakingAmounts({ expected, options }: ExpectStakingAmountsParams) {
        await expect(async () => {
            if (options?.fastForward) {
                await this.page.clock.fastForward(options.fastForward);
            }

            const getStatus = async (locator: Locator) => {
                if ((await locator.count()) === 0) return 'hidden';
                try {
                    return await locator.innerText({ timeout: 100 });
                } catch (error) {
                    // Unmounted mid-read -> 'hidden'; any other error must surface.
                    if ((await locator.count()) === 0) return 'hidden';
                    throw error;
                }
            };

            const [pending, staked, rewards, unstaking] = await Promise.all([
                getStatus(this.pendingAmount),
                getStatus(this.stakedAmount),
                getStatus(this.rewardsAmount),
                getStatus(this.unstakingAmount),
            ]);

            expect(
                { pending, staked, rewards, unstaking },
                'expected Staking dashboard to show correct values',
            ).toEqual(expected);
        }).toPass({ timeout: options?.timeout ?? 15_000 });
    }
}
