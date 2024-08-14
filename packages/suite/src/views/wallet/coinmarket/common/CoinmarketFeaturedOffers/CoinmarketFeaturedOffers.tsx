import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { WalletSubpageHeading } from 'src/components/wallet';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFeaturedOffersItem } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffersItem';

export const CoinmarketFeaturedOffers = () => {
    const context = useCoinmarketFormContext();
    const {
        type,
        form: { state },
        quotes,
    } = context;
    const featuredQuotes = quotes?.filter(quote => quote.infoNote);
    const noFeaturedOffers = !featuredQuotes || featuredQuotes.length === 0;
    if (state.isFormLoading || state.isFormInvalid || noFeaturedOffers) return null;

    const bestRatedQuote = getBestRatedQuote(quotes, type);

    return (
        <>
            <WalletSubpageHeading title="TR_COINMARKET_FEATURED_OFFERS_HEADING" />
            {featuredQuotes.map(quote => (
                <CoinmarketFeaturedOffersItem
                    key={quote?.orderId}
                    context={context}
                    quote={quote}
                    isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                />
            ))}
        </>
    );
};
