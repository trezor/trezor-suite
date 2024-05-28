import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketBuyOffers';
import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';

const CoinmarketOffers = () => {
    const { quotes, quotesRequest } = useCoinmarketBuyOffersContext();

    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    return (
        <>
            <CoinmarketHeader title="TR_BUY_SHOW_OFFERS" titleTimer="TR_BUY_OFFERS_REFRESH" />
            {noOffers ? (
                <CoinmarketOffersEmpty />
            ) : (
                quotes.map(quote => (
                    <CoinmarketOffersItem
                        wantCrypto={!!quotesRequest?.wantCrypto}
                        key={`${quote.exchange}-${quote.paymentMethod}-${quote.receiveCurrency}`}
                        quote={quote}
                    />
                ))
            )}
        </>
    );
};

export default CoinmarketOffers;
