import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getBestRatedQuote } from 'src/utils/wallet/trading/tradingUtils';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingHeader } from 'src/views/wallet/trading/common/TradingHeader/TradingHeader';
import { TradingOffersEmpty } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersEmpty';
import { TradingOffersExchange } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersExchange';
import { TradingOffersItem } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';

export const TradingOffers = () => {
    const context = useTradingFormContext();
    const { type, quotes } = context;
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;
    const bestRatedQuote = getBestRatedQuote(quotes, type);

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const offers = isTradingExchangeContext(context) ? (
        <TradingOffersExchange />
    ) : (
        quotes?.map(quote => (
            <TradingOffersItem
                key={quote?.orderId}
                quote={quote}
                isBestRate={bestRatedQuote?.orderId === quote?.orderId}
            />
        ))
    );

    return (
        <>
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingHeader title="TR_TRADING_SHOW_OFFERS" titleTimer="TR_TRADING_OFFERS_REFRESH" />

            {noOffers ? <TradingOffersEmpty /> : offers}
        </>
    );
};
