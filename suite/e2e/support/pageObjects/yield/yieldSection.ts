import { type Locator, type Page } from '@playwright/test';

import { step } from '../../common';

export class YieldSection {
    readonly dashboardContainer: Locator;
    readonly yieldTitle: Locator;
    readonly accountLabels: Locator;
    readonly vaultSubtitles: Locator;
    readonly apyPercentages: Locator;
    readonly depositNowButtons: Locator;
    readonly depositMoreButtons: Locator;
    readonly withdrawButtons: Locator;
    // APY breakdown tooltip — rendered in a portal, scoped to page
    readonly yearlyRewardAmounts: Locator;
    readonly potentialRewardAmounts: Locator;
    readonly apyBreakdownSymbols: Locator;
    readonly apyBreakdownDescriptions: Locator;
    readonly apyBreakdownRates: Locator;
    readonly apyBreakdownFooter: Locator;

    constructor(private readonly page: Page) {
        this.dashboardContainer = this.page.getByTestId('@earn/dashboard');
        this.yieldTitle = this.dashboardContainer.getByTestId('@earn/dashboard/yield-title');
        this.accountLabels = this.dashboardContainer.getByTestId('@earn/dashboard/account-label');
        this.vaultSubtitles = this.dashboardContainer.getByTestId('@earn/dashboard/subtitle');
        this.apyPercentages = this.dashboardContainer.getByTestId('@earn/dashboard/apy-percentage');
        this.depositNowButtons = this.dashboardContainer.getByTestId(
            '@earn/dashboard/deposit-now-button',
        );
        this.depositMoreButtons = this.dashboardContainer.getByTestId(
            '@earn/dashboard/deposit-more-button',
        );
        this.withdrawButtons = this.dashboardContainer.getByTestId(
            '@earn/dashboard/withdraw-button',
        );
        this.yearlyRewardAmounts = this.dashboardContainer.getByTestId(
            '@earn/dashboard/yearly-rewards/amount',
        );
        this.potentialRewardAmounts = this.dashboardContainer.getByTestId(
            '@earn/dashboard/potential-rewards/amount',
        );
        this.apyBreakdownSymbols = this.page.getByTestId('@earn/dashboard/apy-breakdown/symbol');
        this.apyBreakdownDescriptions = this.page.getByTestId(
            '@earn/dashboard/apy-breakdown/description',
        );
        this.apyBreakdownRates = this.page.getByTestId(
            '@earn/dashboard/apy-breakdown/rate-percent',
        );
        this.apyBreakdownFooter = this.page.getByTestId('@earn/dashboard/apy-breakdown/footer');
    }

    accountLabel(index: number): Locator {
        return this.accountLabels.nth(index);
    }

    vaultSubtitle(index: number): Locator {
        return this.vaultSubtitles.nth(index);
    }

    apyPercentage(index: number): Locator {
        return this.apyPercentages.nth(index);
    }

    yearlyRewardAmount(index: number): Locator {
        return this.yearlyRewardAmounts.nth(index);
    }

    potentialRewardAmount(index: number): Locator {
        return this.potentialRewardAmounts.nth(index);
    }

    @step()
    async hoverApyPercentage(index: number) {
        await this.apyPercentages.nth(index).hover();
    }

    @step()
    async clickDepositNow(index: number) {
        await this.depositNowButtons.nth(index).click();
    }
}
