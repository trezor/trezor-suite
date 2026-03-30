import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

export type GroupedTradingExchangeQuotes = {
    fixed: ExchangeTrade[];
    float: ExchangeTrade[];
    dex: ExchangeTrade[];
};

type ExchangeProvidersMap = Record<string, Pick<ExchangeProviderInfo, 'isFixedRate'> | undefined>;

export const groupTradingExchangeQuotesProjection = (
    quotes: ExchangeTrade[],
    providers: ExchangeProvidersMap | undefined,
): GroupedTradingExchangeQuotes =>
    quotes.reduce<GroupedTradingExchangeQuotes>(
        (groups, quote) => {
            const { exchange = '', isDex } = quote;
            const { isFixedRate } = providers?.[exchange] || {};

            if (isDex) {
                groups.dex.push(quote);

                return groups;
            }

            if (isFixedRate) {
                groups.fixed.push(quote);

                return groups;
            }

            groups.float.push(quote);

            return groups;
        },
        {
            fixed: [],
            float: [],
            dex: [],
        },
    );
