import { Locator, Page } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

// The staking part of the Earn dashboard: one row per account that stakes or could, one activate
// row per network without an account, and the header total above them.
export class EarnStakingDashboardSection {
    readonly totalBalance: Locator;
    readonly accountRow = (symbol: NetworkSymbol, index = 0) =>
        this.page.getByTestId(`@earn/dashboard/staking-account/${symbol}-${index}`);
    readonly activateRow = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@earn/dashboard/activate-row/${symbol}`);
    readonly rateOf = (row: Locator) => row.getByTestId('@earn/dashboard/staking-rate');
    readonly stakedAmountOf = (row: Locator) => row.getByTestId('@earn/dashboard/staked-amount');
    readonly minimumStakeOf = (row: Locator) => row.getByTestId('@earn/dashboard/minimum-stake');
    readonly stakeMoreButtonOf = (row: Locator) =>
        row.getByTestId('@earn/dashboard/stake-more-button');
    readonly stakeNowButtonOf = (row: Locator) =>
        row.getByTestId('@earn/dashboard/stake-now-button');
    readonly voteButtonOf = (row: Locator) => row.getByTestId('@earn/dashboard/vote-button');
    readonly buyButtonOf = (row: Locator) => row.getByTestId('@earn/dashboard/buy-button');

    constructor(private readonly page: Page) {
        this.totalBalance = this.page.getByTestId('@earn/dashboard/total-balance');
    }
}
