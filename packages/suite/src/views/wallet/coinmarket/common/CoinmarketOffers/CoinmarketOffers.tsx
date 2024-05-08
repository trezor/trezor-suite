import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';
import {
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { BuyTrade, SellFiatTrade } from 'invity-api';

const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const quotes = context?.quotes ?? [];
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    const getTitleTimer = () => {
        if (isCoinmarketExchangeOffers(context)) {
            return 'TR_EXCHANGE_OFFERS_REFRESH';
        }

        return isCoinmarketSellOffers(context) ? 'TR_SELL_OFFERS_REFRESH' : 'TR_BUY_OFFERS_REFRESH';
    };

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer={getTitleTimer()}
                showTimerNextToTitle={isCoinmarketExchangeOffers(context)}
            />
            {noOffers ? (
                <CoinmarketOffersEmpty />
            ) : (
                quotes.map(quote => {
                    const typedQuote = quote as BuyTrade | SellFiatTrade;
                    const paymentMethod = typedQuote?.paymentMethod
                        ? `-${typedQuote?.paymentMethod}`
                        : '';
                    const fiatCurrency = typedQuote?.fiatCurrency
                        ? `-${typedQuote?.fiatCurrency}`
                        : '';

                    const key = `${quote.exchange}${paymentMethod}${fiatCurrency}`;

                    return <CoinmarketOffersItem key={key} quote={quote} />;
                })
            )}
        </>
    );
};

export default CoinmarketOffers;
