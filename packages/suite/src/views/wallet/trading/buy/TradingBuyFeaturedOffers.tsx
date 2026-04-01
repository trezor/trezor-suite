import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingBuyBestQuote, selectTradingBuyQuotes } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { WalletSubpageHeading } from 'src/components/wallet';
import { TradingFeaturedOffersItem } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffersItem';

import { useTradingBuyFormContext } from './TradingBuyContext';

export const TradingFeaturedOffers = () => {
    const context = useTradingBuyFormContext();
    const {
        form: { state },
    } = context;

    const quotes = useSelector(selectTradingBuyQuotes);
    const bestRatedQuote = useSelector(selectTradingBuyBestQuote);

    const featuredQuotes = useMemo(() => {
        const filteredQuotes = quotes?.filter(quote => quote.infoNote);
        const noFeaturedOffers = !filteredQuotes || filteredQuotes.length === 0;
        if (state.isFormLoading || state.isFormInvalid || noFeaturedOffers) return null;

        return filteredQuotes;
    }, [quotes, state.isFormInvalid, state.isFormLoading]);

    if (!featuredQuotes) return null;

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
