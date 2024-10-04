import { CoinmarketOffersEmpty } from './CoinmarketOffersEmpty';
import { CoinmarketHeader } from '../CoinmarketHeader/CoinmarketHeader';
import { CoinmarketOffersItem } from './CoinmarketOffersItem';
import {
    isCoinmarketExchangeOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketOffersExchange } from './CoinmarketOffersExchange';

export const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const { type, quotes } = context;
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;
    const bestRatedQuote = getBestRatedQuote(quotes, type);

    const offers = isCoinmarketExchangeOffers(context) ? (
        <CoinmarketOffersExchange />
    ) : (
        quotes?.map(quote => (
            <CoinmarketOffersItem
                key={quote?.orderId}
                quote={quote}
                isBestRate={bestRatedQuote?.orderId === quote?.orderId}
            />
        ))
    );

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer="TR_COINMARKET_OFFERS_REFRESH"
            />
            {noOffers ? <CoinmarketOffersEmpty /> : offers}
        </>
    );
};
