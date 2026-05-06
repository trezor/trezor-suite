import { useMemo } from 'react';

import { Column } from '@trezor/components';

import { WalletSubpageHeading } from 'src/components/wallet';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFeaturedOffersItem } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffersItem';

export const TradingFeaturedOffers = () => {
    const context = useTradingFormContext();
    const {
        form: { state },
        quotes,
    } = context;

    const featuredQuotes = useMemo(() => {
        const filtered = quotes?.filter(quote => quote.infoNote);
        const noFeaturedOffers = !filtered || filtered.length === 0;
        if (state.isFormLoading || state.isFormInvalid || noFeaturedOffers) return null;

        return filtered;
    }, [quotes, state.isFormInvalid, state.isFormLoading]);

    if (!featuredQuotes) return null;

    return (
        <Column>
            <WalletSubpageHeading title="TR_TRADING_FEATURED_OFFERS_HEADING" />
            {featuredQuotes.map(quote => (
                <TradingFeaturedOffersItem key={quote?.orderId} context={context} quote={quote} />
            ))}
        </Column>
    );
};
