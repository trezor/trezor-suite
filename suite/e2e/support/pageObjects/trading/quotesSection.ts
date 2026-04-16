import { Locator, Page } from '@playwright/test';

import { getCompanyNameFromList } from '../../../fixtures/invity';
import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

const quoteProviderLocator = '@trading/offers/quote/provider';

export class TradingQuotesSection {
    readonly list: Locator;
    readonly provider: Locator;
    readonly providerOfQuote = (provider: string) =>
        this.page.getByTestId(`@trading/offers/quote-${provider}`);
    readonly selectedProvider: Locator;
    readonly loadingSpinner: Locator;
    readonly refreshTime: Locator;
    readonly selectButton: Locator;
    readonly bestOfferAmount: Locator;

    constructor(private readonly page: Page) {
        this.list = this.page.getByTestId('@trading/offers/quote');
        this.provider = this.page.getByTestId(quoteProviderLocator);
        this.selectedProvider = this.page.getByTestId('@trading/selected-offer-provider');
        this.loadingSpinner = this.page.getByTestId('@trading/offers/loading-spinner');
        this.refreshTime = this.page.getByTestId('@trading/refresh-time-text');
        this.selectButton = this.page.getByTestId('@trading/offers/get-this-deal-button');
        this.bestOfferAmount = this.page.getByTestId('@trading/best-offer/amount');
    }

    @step()
    async waitForSync() {
        await expect(this.loadingSpinner).toBeHidden({ timeout: 30000 });
        // Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText(/^0( w+)?$/);
    }

    private async validateQuotes({
        quotesResponse,
        listType,
        amountElementID,
        formatExpectedAmount,
        getSelectedPaymentMethod,
    }: {
        quotesResponse: any[];
        listType: 'buyList' | 'sellList';
        amountElementID: string;
        formatExpectedAmount: (quote: any) => string;
        getSelectedPaymentMethod: () => Promise<string>;
    }) {
        const paymentMethod = await getSelectedPaymentMethod();
        const expectedQuotes = quotesResponse.filter(
            quote => quote.paymentMethod === paymentMethod && quote.error === undefined,
        );
        expect.soft(await this.list.count()).toBe(expectedQuotes.length);

        const displayedQuotes = await this.list.all();
        for (const [index, quote] of displayedQuotes.entries()) {
            // Validate provider of the quote row
            const provider = quote.getByTestId(quoteProviderLocator);
            const expectedQuote = expectedQuotes[index];
            if (!expectedQuote) continue;
            const expectedProvider = getCompanyNameFromList(expectedQuote.exchange, listType);
            await expect.soft(provider).toHaveText(expectedProvider);
            // Validate amount of the quote row
            const amount = quote.getByTestId(amountElementID);
            const expectedAmount = formatExpectedAmount(expectedQuote);
            await expect.soft(amount).toHaveText(expectedAmount);
        }
    }

    @step('TradingQuotesSection.validateBuyQuotes()')
    async validateBuyQuotes(
        quotesResponse: any[],
        getSelectedPaymentMethod: () => Promise<string>,
    ) {
        await this.validateQuotes({
            quotesResponse,
            listType: 'buyList',
            amountElementID: '@trading/offers/quote/crypto-amount-with-symbol',
            formatExpectedAmount: quote => `${quote.receiveStringAmount} BTC`,
            getSelectedPaymentMethod,
        });
    }

    @step('TradingQuotesSection.validateSellQuotes()')
    async validateSellQuotes(
        quotesResponse: any[],
        getSelectedPaymentMethod: () => Promise<string>,
    ) {
        await this.validateQuotes({
            quotesResponse,
            listType: 'sellList',
            amountElementID: '@trading/offers/quote/amount',
            formatExpectedAmount: quote => `€${parseFloat(quote.fiatStringAmount).toFixed(2)}`,
            getSelectedPaymentMethod,
        });
    }
}
