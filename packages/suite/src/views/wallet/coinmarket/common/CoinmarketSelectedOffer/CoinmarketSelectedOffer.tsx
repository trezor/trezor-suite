import styled from 'styled-components';
import { Card } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import CoinmarketSelectedOfferVerify from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferVerify';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketSelectedOfferSell from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferSell/CoinmarketSelectedOfferSell';
import { BuyTrade, SellFiatTrade } from 'invity-api';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const Flex = styled.div`
    flex: 1;
`;

export const CoinmarketSelectedOffer = () => {
    const context = useCoinmarketFormContext();
    const { selectedQuote } = context;
    const providers = getProvidersInfoProps(context);

    if (!selectedQuote) return null;

    const quoteAmounts = getCryptoQuoteAmountProps(selectedQuote, context);

    return (
        <Wrapper>
            {isCoinmarketBuyOffers(context) && (
                <Flex>
                    <Card paddingType="none">
                        <CoinmarketSelectedOfferVerify />
                    </Card>
                </Flex>
            )}
            {isCoinmarketSellOffers(context) && (
                <Flex>
                    <Card paddingType="none">
                        <CoinmarketSelectedOfferSell />
                    </Card>
                </Flex>
            )}
            <CoinmarketSelectedOfferInfo
                selectedQuote={selectedQuote as BuyTrade | SellFiatTrade} // TODO: exchange
                providers={providers}
                quoteAmounts={quoteAmounts}
                type={context.type}
            />
        </Wrapper>
    );
};
