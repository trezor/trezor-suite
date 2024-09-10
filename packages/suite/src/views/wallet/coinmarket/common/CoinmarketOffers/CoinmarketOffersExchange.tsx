import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import {
    EXCHANGE_COMPARATOR_KYC_FILTER,
    EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    EXCHANGE_COMPARATOR_RATE_FILTER,
    EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
} from 'src/constants/wallet/coinmarket/form';
import { ExchangeTrade } from 'invity-api';
import { CoinmarketOffersExchangeQuotesByTypeSection } from './CoinmarketOffersExchangeQuotesByTypeSection';
import { KYC_DEX, KYC_NO_KYC } from 'src/constants/wallet/coinmarket/kyc';
import { useMemo } from 'react';

export const CoinmarketOffersExchange = () => {
    const {
        allQuotes: quotes,
        exchangeInfo,
        getValues,
    } = useCoinmarketOffersContext<CoinmarketTradeExchangeType>();
    const exchangeTypeFilter = getValues(EXCHANGE_COMPARATOR_RATE_FILTER);
    const kycFilter = getValues(EXCHANGE_COMPARATOR_KYC_FILTER);
    const showAll = exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_ALL;

    const { fixed, float, dex } = useMemo(() => {
        return (quotes ?? []).reduce<Record<'fixed' | 'float' | 'dex', ExchangeTrade[]>>(
            (groups, quote) => {
                const providerInfo = exchangeInfo?.providerInfos[quote.exchange || ''];
                if (
                    kycFilter === EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC &&
                    providerInfo?.kycPolicyType !== KYC_NO_KYC &&
                    providerInfo?.kycPolicyType !== KYC_DEX
                )
                    return groups;

                if (quote.isDex) {
                    groups.dex.push(quote);
                } else if (providerInfo?.isFixedRate) {
                    groups.fixed.push(quote);
                } else {
                    groups.float.push(quote);
                }

                return groups;
            },
            {
                fixed: [],
                float: [],
                dex: [],
            },
        );
    }, [exchangeInfo?.providerInfos, kycFilter, quotes]);

    if (!quotes) return null;

    return (
        <>
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX) && (
                <CoinmarketOffersExchangeQuotesByTypeSection
                    quotes={fixed}
                    heading="TR_COINMARKET_EXCHANGE_FIXED_OFFERS_HEADING"
                    tooltip="TR_COINMARKET_FIX_RATE_DESCRIPTION"
                />
            )}
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX) && (
                <CoinmarketOffersExchangeQuotesByTypeSection
                    quotes={float}
                    heading="TR_COINMARKET_EXCHANGE_FLOAT_OFFERS_HEADING"
                    tooltip="TR_COINMARKET_FLOATING_RATE_DESCRIPTION"
                />
            )}
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_DEX) && (
                <CoinmarketOffersExchangeQuotesByTypeSection
                    quotes={dex}
                    heading="TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING"
                    tooltip="TR_COINMARKET_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP"
                />
            )}
        </>
    );
};
