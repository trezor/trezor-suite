import { type Locator, type Page } from '@playwright/test';

import { step } from '../../common';

type ClaimAccountParams = {
    symbol: string;
    accountType: string;
    index: number;
};

export class YieldSection {
    readonly earnMenuButton: Locator;
    readonly dashboardContainer: Locator;
    readonly yieldTitle: Locator;
    readonly apyBreakdownSymbols: Locator;
    readonly apyBreakdownDescriptions: Locator;
    readonly apyBreakdownRates: Locator;
    readonly apyBreakdownFooter: Locator;
    readonly claimRewardsButton: Locator;
    readonly claimRewardsAmount: Locator;
    readonly claimSelectAccountModal: Locator;
    readonly claimSelectAccountHeading: Locator;

    constructor(private readonly page: Page) {
        this.earnMenuButton = this.page.getByTestId('@suite/menu/suite-earn');
        this.dashboardContainer = this.page.getByTestId('@earn/dashboard');
        this.yieldTitle = this.dashboardContainer.getByTestId(
            '@dashboard/dashboard-section/heading',
        );
        this.apyBreakdownSymbols = this.page.getByTestId('@earn/dashboard/apy-breakdown/symbol');
        this.apyBreakdownDescriptions = this.page.getByTestId(
            '@earn/dashboard/apy-breakdown/description',
        );
        this.apyBreakdownRates = this.page.getByTestId(
            '@earn/dashboard/apy-breakdown/rate-percent',
        );
        this.apyBreakdownFooter = this.page.getByTestId('@earn/dashboard/apy-breakdown/footer');
        this.claimRewardsButton = this.page.getByTestId('@earn/dashboard/claim-rewards-button');
        this.claimRewardsAmount = this.page.getByTestId('@earn/dashboard/claim-rewards-amount');
        this.claimSelectAccountModal = this.page.getByTestId('@modal/earn-claim-select-account');
        this.claimSelectAccountHeading = this.claimSelectAccountModal.getByTestId('@modal/header');
    }

    claimAccountButton({ symbol, accountType, index }: ClaimAccountParams): Locator {
        return this.claimSelectAccountModal.getByTestId(
            `@earn/claim-select-account/account/${symbol}-${accountType}-${index}`,
        );
    }

    claimAccountRewardAmounts(account: ClaimAccountParams): Locator {
        return this.claimAccountButton(account).getByTestId(
            '@earn/claim-select-account/reward-amounts',
        );
    }

    claimAccountFiatAmount(account: ClaimAccountParams): Locator {
        return this.claimAccountButton(account).getByTestId(
            '@earn/claim-select-account/fiat-amount',
        );
    }

    row(vaultId: string): Locator {
        return this.dashboardContainer.getByTestId(`@earn/dashboard/row/${vaultId}`);
    }

    accountLabel(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/account-label');
    }

    vaultSubtitle(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/subtitle');
    }

    apyPercentage(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/apy-percentage');
    }

    yearlyRewardAmount(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/yearly-rewards/amount');
    }

    depositedAmount(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/deposited-amount');
    }

    potentialRewardAmount(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/potential-rewards/amount');
    }

    withdrawButton(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/withdraw-button');
    }

    depositMoreButton(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/deposit-more-button');
    }

    depositNowButton(vaultId: string): Locator {
        return this.row(vaultId).getByTestId('@earn/dashboard/deposit-now-button');
    }

    @step()
    async hoverApyPercentage(vaultId: string) {
        await this.apyPercentage(vaultId).hover();
    }

    @step()
    async clickDepositNow(vaultId: string) {
        await this.row(vaultId).getByTestId('@earn/dashboard/deposit-now-button').click();
    }
}
