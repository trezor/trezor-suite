import { getBestRatedQuote } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { WalletSubpageHeading } from 'src/components/wallet';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFeaturedOffersItem } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffersItem';

export const TradingFeaturedOffers = () => {
    const context = useTradingFormContext();
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
        <Column>
            <WalletSubpageHeading title="TR_TRADING_FEATURED_OFFERS_HEADING" />
            {featuredQuotes.map(quote => (
                <TradingFeaturedOffersItem
                    key={quote?.orderId}
                    context={context}
                    quote={quote}
                    isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                />
            ))}
        </Column>
    );
};
