import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const quotes =
        isCoinmarketBuyOffers(context) || isCoinmarketSellOffers(context) ? context.quotes : [];

    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer={
                    isCoinmarketSellOffers(context)
                        ? 'TR_SELL_OFFERS_REFRESH'
                        : 'TR_BUY_OFFERS_REFRESH'
                }
            />
            {noOffers ? (
                <CoinmarketOffersEmpty />
            ) : (
                quotes.map(quote => {
                    const key = `${quote.exchange}-${quote.paymentMethod}-${quote.fiatCurrency}`;

                    return <CoinmarketOffersItem key={key} quote={quote} />;
                })
            )}
        </>
    );
};

export default CoinmarketOffers;
