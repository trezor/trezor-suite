import { Card, Column } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingOfferExchangeProps } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingOfferExchange } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchange';

export const TradingSelectedOffer = () => {
    const context = useTradingFormContext();
    const { account, trade, selectedQuote } = context;
    const providers = getProvidersInfoProps(context);
    const selectedTrade = trade?.data || selectedQuote;

    if (!selectedTrade) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(selectedTrade, context);

    if (isTradingExchangeContext(context)) {
        return (
            <Column width="100%" alignItems="center">
                <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                    <TradingOfferExchange
                        account={account}
                        selectedQuote={selectedTrade as TradingOfferExchangeProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                    />
                </Card>
            </Column>
        );
    }

    return null;
};
