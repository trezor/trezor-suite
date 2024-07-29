import CoinmarketFeaturedOffersItem from './CoinmarketFeaturedOffersItem';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { WalletSubpageHeading } from 'src/components/wallet';
import { ExchangeTrade } from 'invity-api';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

const CoinmarketFeaturedOffers = () => {
    const context = useCoinmarketFormContext();
    const {
        type,
        form: { state },
    } = context;
    const quotes = context?.quotes ?? [];
    const featuredQuotes = quotes.filter(quote => quote.infoNote);
    const noFeaturedOffers = featuredQuotes.length === 0;
    const bestRatedQuote = getBestRatedQuote(quotes, type);

    // for now do not show featured offers on exchange
    if (isCoinmarketExchangeOffers(context)) return null;

    if (state.isFormLoading || state.isFormInvalid || noFeaturedOffers) return null;

    return (
        <>
            <WalletSubpageHeading title="TR_COINMARKET_FEATURED_OFFERS_HEADING" />
            {featuredQuotes.map(_quote => {
                const quote = _quote as Exclude<typeof _quote, ExchangeTrade>; // for now only on sell and buy

                return (
                    <CoinmarketFeaturedOffersItem
                        key={quote?.orderId}
                        context={context}
                        quote={quote}
                        isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                    />
                );
            })}
        </>
    );
};

export default CoinmarketFeaturedOffers;
