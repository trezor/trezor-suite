import { type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

export type GroupedExchangeQuotesByRateType = {
    fixed: ExchangeTrade[];
    float: ExchangeTrade[];
};

/** Read-only sentinel; do not mutate (shared empty arrays). */
export const EMPTY_GROUPED_EXCHANGE_QUOTES_BY_RATE_TYPE: GroupedExchangeQuotesByRateType = {
    fixed: [],
    float: [],
};

type ExchangeProvidersMap = Record<string, Pick<ExchangeProviderInfo, 'isFixedRate'> | undefined>;

export const groupExchangeQuotesByRateTypeProjection = (
    quotes: ExchangeTrade[],
    providers: ExchangeProvidersMap | undefined,
): GroupedExchangeQuotesByRateType =>
    quotes.reduce<GroupedExchangeQuotesByRateType>(
        (groups, quote) => {
            const { exchange = '' } = quote;
            const { isFixedRate } = providers?.[exchange] || {};

            if (isFixedRate) {
                groups.fixed.push(quote);
            } else {
                groups.float.push(quote);
            }

            return groups;
        },
        {
            fixed: [],
            float: [],
        },
    );
