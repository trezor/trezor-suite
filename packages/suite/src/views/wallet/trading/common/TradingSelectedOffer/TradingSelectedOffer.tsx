import styled from 'styled-components';

import { Card, Column } from '@trezor/components';

import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingOfferExchangeProps, TradingOfferSellProps } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getPaymentMethod,
    getProvidersInfoProps,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingOfferExchange } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchange';
import { TradingOfferSell } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSell';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

export const TradingSelectedOffer = () => {
    const context = useTradingFormContext();
    const { account, trade, selectedQuote } = context;
    const providers = getProvidersInfoProps(context);
    const selectedTrade = trade?.data || selectedQuote;

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    if (!selectedTrade) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(selectedTrade, context);
    const paymentMethod = getPaymentMethod(selectedTrade, context);

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

    if (isTradingSellContext(context)) {
        return (
            <Column gap={16}>
                {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

                <Wrapper data-testid="@trading/selected-offer">
                    <TradingOfferSell
                        account={account}
                        selectedQuote={selectedTrade as TradingOfferSellProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                </Wrapper>
            </Column>
        );
    }

    return null;
};
