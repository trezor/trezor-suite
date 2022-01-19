import React from 'react';
import styled from 'styled-components';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from '@wallet-components';
import { CoinmarketBuyOffersContext, useOffers } from '@wallet-hooks/useCoinmarketBuyOffers';
import Offers from './Offers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketOffersValues = useOffers(props);
    return (
        <CoinmarketBuyOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketBuyOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_BUY',
});
