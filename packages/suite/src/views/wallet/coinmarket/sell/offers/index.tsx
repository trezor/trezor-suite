import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import styled from 'styled-components';
import { CoinmarketSellOffersContext, useOffers } from 'src/hooks/wallet/useCoinmarketSellOffers';
import Offers from './Offers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketOffersValues = useOffers(props);

    return (
        <CoinmarketSellOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketSellOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_SELL',
});
