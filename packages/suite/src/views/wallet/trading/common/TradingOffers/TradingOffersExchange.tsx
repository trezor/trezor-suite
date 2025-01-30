import { useMemo } from 'react';

import { ExchangeTrade } from 'invity-api';

import type { TradingExchangeType } from '@suite-common/trading';

import {
    EXCHANGE_COMPARATOR_KYC_FILTER,
    EXCHANGE_COMPARATOR_KYC_FILTER_NO_KYC,
    EXCHANGE_COMPARATOR_RATE_FILTER,
    EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
} from 'src/constants/wallet/trading/form';
import { KYC_DEX, KYC_NO_KYC } from 'src/constants/wallet/trading/kyc';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingOffersExchangeQuotesByTypeSection } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersExchangeQuotesByTypeSection';

export const TradingOffersExchange = () => {
    const { quotes, exchangeInfo, getValues } = useTradingFormContext<TradingExchangeType>();
    const exchangeTypeFilter = getValues(EXCHANGE_COMPARATOR_RATE_FILTER);
    const kycFilter = getValues(EXCHANGE_COMPARATOR_KYC_FILTER);
    const showAll = exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_ALL;

    const { fixed, float, dex } = useMemo(
        () =>
            (quotes ?? []).reduce<Record<'fixed' | 'float' | 'dex', ExchangeTrade[]>>(
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
            ),
        [exchangeInfo?.providerInfos, kycFilter, quotes],
    );

    if (!quotes) return null;

    return (
        <>
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={fixed}
                    heading="TR_TRADING_EXCHANGE_FIXED_OFFERS_HEADING"
                    tooltip="TR_TRADING_FIX_RATE_DESCRIPTION"
                />
            )}
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={float}
                    heading="TR_TRADING_EXCHANGE_FLOAT_OFFERS_HEADING"
                    tooltip="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                />
            )}
            {(showAll || exchangeTypeFilter === EXCHANGE_COMPARATOR_RATE_FILTER_DEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={dex}
                    heading="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING"
                    tooltip="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP"
                />
            )}
        </>
    );
};
