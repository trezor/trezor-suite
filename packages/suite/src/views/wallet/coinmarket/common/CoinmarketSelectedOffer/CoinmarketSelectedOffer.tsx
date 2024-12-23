import styled from 'styled-components';

import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    getCryptoQuoteAmountProps,
    getPaymentMethod,
    getProvidersInfoProps,
    isCoinmarketBuyContext,
    isCoinmarketExchangeContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { CoinmarketOfferSell } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferSell/CoinmarketOfferSell';
import { CoinmarketOfferBuy } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferBuy/CoinmarketOfferBuy';
import { CoinmarketOfferExchange } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferExchange/CoinmarketOfferExchange';
import { CoinmarketWrapper } from 'src/views/wallet/coinmarket/common/CoinmarketWrapper';
import { useCoinmarketDeviceDisconnected } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketDeviceDisconnected';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

export const CoinmarketSelectedOffer = () => {
    const context = useCoinmarketFormContext();
    const { account } = context;
    const providers = getProvidersInfoProps(context);

    const { coinmarketDeviceDisconnected } = useCoinmarketDeviceDisconnected();

    if (!context.selectedQuote) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(context.selectedQuote, context);
    const paymentMethod = getPaymentMethod(context.selectedQuote, context);

    return (
        <Column gap={spacings.md}>
            {coinmarketDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <Wrapper data-testid="@coinmarket/selected-offer">
                {isCoinmarketBuyContext(context) && (
                    <CoinmarketOfferBuy
                        account={account}
                        selectedQuote={context.selectedQuote}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isCoinmarketSellContext(context) && (
                    <CoinmarketOfferSell
                        account={account}
                        selectedQuote={context.selectedQuote}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isCoinmarketExchangeContext(context) && (
                    <CoinmarketOfferExchange
                        account={account}
                        selectedQuote={context.selectedQuote}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                    />
                )}
            </Wrapper>
        </Column>
    );
};
