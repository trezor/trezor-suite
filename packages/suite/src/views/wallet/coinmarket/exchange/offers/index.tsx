import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import styled from 'styled-components';
import {
    CoinmarketExchangeOffersContext,
    useOffers,
} from 'src/hooks/wallet/useCoinmarketExchangeOffers';
import Offers from './Offers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketOffersValues = useOffers(props);

    return (
        <CoinmarketExchangeOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketExchangeOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_EXCHANGE',
});
