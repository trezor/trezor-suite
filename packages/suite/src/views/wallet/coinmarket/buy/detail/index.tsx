import React from 'react';
import styled from 'styled-components';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from '@wallet-components';
import {
    useCoinmarketBuyDetail,
    CoinmarketBuyDetailContext,
} from '@wallet-hooks/useCoinmarketBuyDetail';
import Detail from './Detail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyDetail(props);
    return (
        <CoinmarketBuyDetailContext.Provider value={coinmarketBuyContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketBuyDetailContext.Provider>
    );
};

export default withSelectedAccountLoaded(DetailIndex, {
    title: 'TR_NAV_BUY',
});
