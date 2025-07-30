import { Locator, Page, expect } from '@playwright/test';

import { paletteV1 } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

export class StakingSection {
    readonly watchPeriod = '01:00';
    // Locators
    readonly stakingTabButton: Locator;
    readonly stakingDashboardCard: Locator;
    readonly stakingEmptyCard: Locator;
    readonly pendingAmount: Locator;
    readonly stakedAmount: Locator;
    readonly rewardsAmount: Locator;
    readonly unstakingAmount: Locator;
    readonly unstakeToClaimButton: Locator;
    readonly availableBalanceWithSymbol: Locator;
    readonly cryptoInput: Locator;
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

    constructor(private readonly page: Page) {
        this.stakingTabButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakingDashboardCard = this.page.getByTestId('@wallet/staking/card');
        this.stakingEmptyCard = this.page.getByTestId('@wallet/staking/empty-card');
        this.pendingAmount = this.page.getByTestId('@account/staking/pending');
        this.stakedAmount = this.page.getByTestId('@account/staking/staked');
        this.rewardsAmount = this.page.getByTestId('@account/staking/rewards');
        this.unstakingAmount = this.page.getByTestId('@account/staking/unstaking');
        this.unstakeToClaimButton = this.page.getByRole('button', { name: 'Unstake to claim' });
        this.availableBalanceWithSymbol = this.page.getByTestId(
            '@staking/available-balance-with-symbol',
        );
        this.cryptoInput = this.page.getByTestId('@staking/form/crypto-input');
        this.unstakeButton = this.page
            .getByTestId('@modal')
            .getByRole('button', { name: 'Unstake' });
        this.speedUpButton = this.page.getByRole('button', { name: 'Speed up' });
        this.pendingTransactionText = this.page.getByText('Pending transaction•1');
        this.stakeMoreButton = this.page.getByRole('button', { name: 'Stake more' });
        this.startStakingButton = this.page.getByRole('button', { name: 'Start staking' });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
        this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
        this.acknowledgeCheckbox = this.page.getByTestId('@staking/acknowledge-checkbox');
        this.everstakeAcknowledgeCheckbox = this.page.getByTestId(
            '@staking/everstake-acknowledge-checkbox',
        );
        this.confirmAndStakeButton = this.page.getByRole('button', { name: 'Confirm & stake' });
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
    }

    async expectProgressIndicatorsToMatchPhase(
        phase: 'pendingTransaction' | 'addingToPool' | 'receivingRewards',
    ) {
        const phaseIndicatorColors = {
            pendingTransaction: {
                transactionStep: paletteV1.lightAccentYellow300,
                addingStep: paletteV1.lightGray100,
                rewardsStep: paletteV1.lightGray100,
            },
            addingToPool: {
                transactionStep: paletteV1.lightPrimaryForest200,
                addingStep: paletteV1.lightAccentYellow300,
                rewardsStep: paletteV1.lightGray100,
            },
            receivingRewards: {
                transactionStep: paletteV1.lightPrimaryForest200,
                addingStep: paletteV1.lightPrimaryForest200,
                rewardsStep: paletteV1.lightAccentYellow300,
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

    async expectStakingAmounts(options: {
        pending: string | 'hidden';
        staked: string | 'hidden';
        rewards: string | 'hidden';
        unstaking: string | 'hidden';
    }) {
        const amounts = [
            { locator: this.pendingAmount, value: options.pending },
            { locator: this.stakedAmount, value: options.staked },
            { locator: this.rewardsAmount, value: options.rewards },
            { locator: this.unstakingAmount, value: options.unstaking },
        ];

        for (const { locator, value } of amounts) {
            if (value === 'hidden') {
                await expect(locator).toBeHidden();
            } else {
                await expect(locator).toHaveText(value);
            }
        }
    }
}
