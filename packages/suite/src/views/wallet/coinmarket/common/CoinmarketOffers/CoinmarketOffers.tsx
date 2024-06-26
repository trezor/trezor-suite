import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';
import {
    isCoinmarketExchangeOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const { type } = context;
    const quotes = context?.quotes ?? [];
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    const bestRatedQuote = getBestRatedQuote(quotes, type);

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer="TR_COINMARKET_OFFERS_REFRESH"
                showTimerNextToTitle={isCoinmarketExchangeOffers(context)}
            />
            {noOffers ? (
                <CoinmarketOffersEmpty />
            ) : (
                quotes.map(quote => {
                    return (
                        <CoinmarketOffersItem
                            key={quote?.orderId}
                            quote={quote}
                            isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                        />
                    );
                })
            )}
        </>
    );
};

export default CoinmarketOffers;
