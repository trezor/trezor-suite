import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class TradingQuotesSection {
    readonly list: Locator;
    readonly provider: Locator;
    readonly providerOfQuote = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly selectedProvider: Locator;
    readonly selectedProviderName: Locator;
    readonly loadingSpinner: Locator;
    readonly bestOfferAmount: Locator;

    constructor(private readonly page: Page) {
        this.list = this.page.getByTestId('@trading/offers/quote');
        this.provider = this.page.getByTestId('@trading/offers/quote/provider');
        this.selectedProvider = this.page.getByTestId('@trading/selected-offer-provider');
        this.selectedProviderName = this.selectedProvider.getByTestId(
            '@trading/offers/quote/provider',
        );
        this.loadingSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.bestOfferAmount = this.page.getByTestId('@trading/best-offer/amount');
    }

    @step()
    async waitForSync() {
        await expect(this.loadingSpinner).toBeHidden({ timeout: 30000 });
        // Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText(/^0( \w+)?$/);
    }

    @step()
    async getBestOfferAmount(): Promise<string> {
        await expect(this.bestOfferAmount).toHaveText(/^(?=[\d,.]*[1-9])[\d,]+(\.\d+)?\s+\w+$/);
        const rawText = await this.bestOfferAmount.textContent();
        if (!rawText) {
            throw new Error('Best offer amount did not have any text content');
        }

        const [amount] = rawText.trim().split(/\s+/);
        if (!amount) {
            throw new Error(`Best offer amount could not be parsed from "${rawText}"`);
        }

        return amount;
    }

    @step()
    async selectQuoteByProvider(provider: string) {
        await this.provider.filter({ hasText: provider }).click();
    }

    //  When `provider` is given, that specific provider is selected(must be
    //  present in the list) Otherwise a random provider different from the currently
    //  selected one is picked. When only a single provider is available it re-selects it

    @step()
    async chooseDifferentOfferIfAvailable(provider?: string): Promise<void> {
        const initialProvider = (await this.selectedProviderName.textContent())?.trim();
        if (!initialProvider) {
            throw new Error('Cannot get text content from the initial provider.');
        }

        await this.selectedProvider.click();
        await expect(this.list.first()).toBeVisible();

        const offerProviderNames = (
            await this.list.getByTestId('@trading/offers/quote/provider').allTextContents()
        ).map(name => name.trim());

        let differentProvider: string | undefined;
        if (provider) {
            differentProvider = offerProviderNames.find(name => name === provider);
            if (!differentProvider) {
                throw new Error(
                    `Provider "${provider}" not found in offers. Available: ${offerProviderNames.join(', ')}`,
                );
            }
        } else {
            const candidates = offerProviderNames.filter(name => name && name !== initialProvider);
            differentProvider = candidates[Math.floor(Math.random() * candidates.length)];
        }

        const providerToSelect = differentProvider ?? initialProvider;
        await this.list
            .filter({ has: this.provider.filter({ hasText: providerToSelect }) })
            .first()
            .click();
        await expect(this.selectedProviderName).toHaveText(providerToSelect);
    }
}
