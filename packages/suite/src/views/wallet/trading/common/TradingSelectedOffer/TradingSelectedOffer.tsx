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
import {
    CoinmarketOfferBuyProps,
    CoinmarketOfferExchangeProps,
    CoinmarketOfferSellProps,
} from 'src/types/coinmarket/coinmarketForm';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

export const CoinmarketSelectedOffer = () => {
    const context = useCoinmarketFormContext();
    const { account, trade, selectedQuote } = context;
    const providers = getProvidersInfoProps(context);
    const selectedTrade = trade?.data || selectedQuote;

    const { coinmarketDeviceDisconnected } = useCoinmarketDeviceDisconnected();

    if (!selectedTrade) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(selectedTrade, context);
    const paymentMethod = getPaymentMethod(selectedTrade, context);

    return (
        <Column gap={spacings.md}>
            {coinmarketDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <Wrapper data-testid="@coinmarket/selected-offer">
                {isCoinmarketBuyContext(context) && (
                    <CoinmarketOfferBuy
                        account={account}
                        selectedQuote={selectedTrade as CoinmarketOfferBuyProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isCoinmarketSellContext(context) && (
                    <CoinmarketOfferSell
                        account={account}
                        selectedQuote={selectedTrade as CoinmarketOfferSellProps['selectedQuote']}
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                        {...paymentMethod}
                    />
                )}
                {isCoinmarketExchangeContext(context) && (
                    <CoinmarketOfferExchange
                        account={account}
                        selectedQuote={
                            selectedTrade as CoinmarketOfferExchangeProps['selectedQuote']
                        }
                        providers={providers}
                        type={context.type}
                        quoteAmounts={quoteAmounts}
                    />
                )}
            </Wrapper>
        </Column>
    );
};
