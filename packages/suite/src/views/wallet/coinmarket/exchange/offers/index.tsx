import React from 'react';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from '@wallet-components';
import styled from 'styled-components';
import {
    CoinmarketExchangeOffersContext,
    useOffers,
} from '@wallet-hooks/useCoinmarketExchangeOffers';
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
