import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class TradingQuotesSection {
    readonly list: Locator;
    readonly provider: Locator;
    readonly providerOfQuote = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly providerInList: Locator;
    readonly selectedProvider: Locator;
    readonly selectedProviderName: Locator;

    constructor(private readonly page: Page) {
        this.list = this.page.getByTestId('@trading/offers/quote');
        this.provider = this.page.getByTestId('@trading/offers/quote/provider');
        this.providerInList = this.list.getByTestId('@trading/offers/quote/provider');
        this.selectedProvider = this.page.getByTestId('@trading/selected-offer-provider');
        this.selectedProviderName = this.selectedProvider.getByTestId(
            '@trading/offers/quote/provider',
        );
    }

    @step()
    async waitForSync() {
        await expect(this.selectedProviderName).not.toBeEmpty({ timeout: 30_000 });
    }

    //  When `provider` is given, that specific provider is selected(must be
    //  present in the list) Otherwise a random provider different from the currently
    //  selected one is picked. When only a single provider is available it re-selects it

    @step()
    async chooseDifferentOfferIfAvailable(provider?: string): Promise<void> {
        await expect(this.selectedProviderName).not.toBeEmpty();
        const initialProvider = (await this.selectedProviderName.innerText()).trim();

        await this.selectedProvider.click();
        await expect(this.list.first()).toBeVisible();

        const offerProviderNames = (await this.providerInList.allInnerTexts()).map(name =>
            name.trim(),
        );

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
