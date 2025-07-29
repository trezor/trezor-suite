import { Locator, Page, expect } from '@playwright/test';

import { paletteV1 } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

export class StakingSection {
    readonly watchPeriod = '01:00';
    // Locators
    readonly stakingTabButton: Locator;
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
    readonly continueButton: Locator;
    readonly acknowledgeCheckbox: Locator;
    readonly confirmAndStakeButton: Locator;
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
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });
        this.acknowledgeCheckbox = this.page.getByTestId('@staking/acknowledge-checkbox');
        this.confirmAndStakeButton = this.page.getByRole('button', { name: 'Confirm & stake' });
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

    async expectStakingLabelToBeInPhase(
        phase: 'pendingTransaction' | 'addingToPool' | 'receivingRewards',
    ) {
        const phaseColors = {
            pendingTransaction: {
                transaction: paletteV1.lightAccentYellow300,
                adding: paletteV1.lightGray100,
                rewards: paletteV1.lightGray100,
            },
            addingToPool: {
                transaction: paletteV1.lightPrimaryForest200,
                adding: paletteV1.lightAccentYellow300,
                rewards: paletteV1.lightGray100,
            },
            receivingRewards: {
                transaction: paletteV1.lightPrimaryForest200,
                adding: paletteV1.lightPrimaryForest200,
                rewards: paletteV1.lightAccentYellow300,
            },
        };
        await expect(this.transactionStatusContainer).toHaveCSS(
            'background-color',
            hexToRgba(phaseColors[phase].transaction),
        );
        await expect(this.addingToPoolStatusContainer).toHaveCSS(
            'background-color',
            hexToRgba(phaseColors[phase].adding),
        );
        await expect(this.receivingRewardsContainer).toHaveCSS(
            'background-color',
            hexToRgba(phaseColors[phase].rewards),
        );
    }
}
