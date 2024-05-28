import { withSelectedAccountLoaded } from 'src/components/wallet';
import styled from 'styled-components';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import {
    useCoinmarketSellOffers,
    CoinmarketSellOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketSellOffers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketSellOffers = useCoinmarketSellOffers(props);

    return (
        <CoinmarketSellOffersContext.Provider value={coinmarketSellOffers}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketSellOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_SELL',
});
