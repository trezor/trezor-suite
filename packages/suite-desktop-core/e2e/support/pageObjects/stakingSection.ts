import { Locator, Page } from '@playwright/test';

export class StakingSection {
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
        this.cryptoInput = this.page.getByTestId('@staking/unstaking-form/crypto-input');
        this.unstakeButton = this.page
            .getByTestId('@modal')
            .getByRole('button', { name: 'Unstake' });
        this.speedUpButton = this.page.getByRole('button', { name: 'Speed up' });
        this.pendingTransactionText = this.page.getByText('Pending transaction•1');
    }
}
