import styled from 'styled-components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    getCryptoQuoteAmountProps,
    getPaymentMethod,
    getProvidersInfoProps,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import {
    isCoinmarketBuyOffers,
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketWrapper } from 'src/views/wallet/coinmarket';
import { CoinmarketOfferSell } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferSell/CoinmarketOfferSell';
import { CoinmarketOfferBuy } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferBuy/CoinmarketOfferBuy';
import { CoinmarketOfferExchange } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferExchange/CoinmarketOfferExchange';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

export const CoinmarketSelectedOffer = () => {
    const context = useCoinmarketFormContext();
    const { account } = context;
    const providers = getProvidersInfoProps(context);

    if (!context.selectedQuote) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(context.selectedQuote, context);
    const paymentMethod = getPaymentMethod(context.selectedQuote, context);

    return (
        <Wrapper>
            {isCoinmarketBuyOffers(context) && (
                <CoinmarketOfferBuy
                    account={account}
                    selectedQuote={context.selectedQuote}
                    providers={providers}
                    type={context.type}
                    quoteAmounts={quoteAmounts}
                    {...paymentMethod}
                />
            )}
            {isCoinmarketSellOffers(context) && (
                <CoinmarketOfferSell
                    account={account}
                    selectedQuote={context.selectedQuote}
                    providers={providers}
                    type={context.type}
                    quoteAmounts={quoteAmounts}
                    {...paymentMethod}
                />
            )}
            {isCoinmarketExchangeOffers(context) && (
                <CoinmarketOfferExchange
                    account={account}
                    selectedQuote={context.selectedQuote}
                    providers={providers}
                    type={context.type}
                    quoteAmounts={quoteAmounts}
                />
            )}
        </Wrapper>
    );
};
