import { useSelector } from 'react-redux';

import {
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX,
    TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX,
    type TradingExchangeType,
    selectGroupedTradingExchangeQuotes,
} from '@suite-common/trading';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingOffersExchangeQuotesByTypeSection } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersExchangeQuotesByTypeSection';

import { TradingUtilsTorWarning } from '../TradingUtils/TradingUtilsTorWarning';

export const TradingOffersExchange = () => {
    const { quotes, getValues } = useTradingFormContext<TradingExchangeType>();
    const exchangeTypeFilter = getValues(TRADING_EXCHANGE_COMPARATOR_RATE_FILTER);
    const showAll = exchangeTypeFilter === TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_ALL;

    const { fixed, float, dex } = useSelector(selectGroupedTradingExchangeQuotes);

    if (!quotes) {
        return <TradingUtilsTorWarning tradingType="exchange" noOffer={false} />;
    }

    return (
        <>
            <TradingUtilsTorWarning tradingType="exchange" noOffer={false} />
            {(showAll || exchangeTypeFilter === TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_DEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={dex}
                    heading="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING"
                    tooltip="TR_TRADING_EXCHANGE_DEX_OFFERS_HEADING_TOOLTIP"
                />
            )}
            {(showAll ||
                exchangeTypeFilter === TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FLOATING_CEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={float}
                    heading="TR_TRADING_EXCHANGE_FLOAT_OFFERS_HEADING"
                    tooltip="TR_TRADING_FLOATING_RATE_DESCRIPTION"
                />
            )}
            {(showAll ||
                exchangeTypeFilter === TRADING_EXCHANGE_COMPARATOR_RATE_FILTER_FIXED_CEX) && (
                <TradingOffersExchangeQuotesByTypeSection
                    quotes={fixed}
                    heading="TR_TRADING_EXCHANGE_FIXED_OFFERS_HEADING"
                    tooltip="TR_TRADING_FIX_RATE_DESCRIPTION"
                />
            )}
        </>
    );
};
