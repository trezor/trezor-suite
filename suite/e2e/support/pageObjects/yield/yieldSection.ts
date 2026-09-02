import { type Locator, type Page } from '@playwright/test';

import { step } from '../../common';

export class YieldSection {
    readonly earnMenuButton: Locator;
    readonly dashboardContainer: Locator;
    readonly yieldTitle: Locator;
    readonly apyBreakdownSymbols: Locator;
    readonly apyBreakdownDescriptions: Locator;
    readonly apyBreakdownRates: Locator;
    readonly apyBreakdownFooter: Locator;

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
