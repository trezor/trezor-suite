import styled from 'styled-components';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingOfferBuyProps,
    TradingOfferExchangeProps,
    TradingOfferSellProps,
} from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getPaymentMethod,
    getProvidersInfoProps,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingOfferBuy } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferBuy/TradingOfferBuy';
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

    return (
        <Column gap={spacings.md}>
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <Wrapper data-testid="@trading/selected-offer">
                {isTradingBuyContext(context) && (
                    <TradingOfferBuy
                        account={account}
                        selectedQuote={selectedTrade as TradingOfferBuyProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isTradingSellContext(context) && (
                    <TradingOfferSell
                        account={account}
                        selectedQuote={selectedTrade as TradingOfferSellProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isTradingExchangeContext(context) && (
                    <TradingOfferExchange
                        account={account}
                        selectedQuote={selectedTrade as TradingOfferExchangeProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                    />
                )}
            </Wrapper>
        </Column>
    );
};
