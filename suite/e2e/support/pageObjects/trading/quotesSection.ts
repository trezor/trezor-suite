import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class TradingQuotesSection {
    readonly list: Locator;
    readonly provider: Locator;
    readonly providerOfQuote = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly selectedProvider: Locator;
    readonly loadingSpinner: Locator;
    readonly bestOfferAmount: Locator;

    constructor(private readonly page: Page) {
        this.list = this.page.getByTestId('@trading/offers/quote');
        this.provider = this.page.getByTestId('@trading/offers/quote/provider');
        this.selectedProvider = this.page.getByTestId('@trading/selected-offer-provider');
        this.loadingSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.bestOfferAmount = this.page.getByTestId('@trading/best-offer/amount');
    }

    @step()
    async waitForSync() {
        await expect(this.loadingSpinner).toBeHidden({ timeout: 30000 });
        // Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText(/^0( w+)?$/);
    }

    @step()
    async selectQuoteByProvider(provider: string) {
        await this.provider.filter({ hasText: provider }).click();
    }
}
