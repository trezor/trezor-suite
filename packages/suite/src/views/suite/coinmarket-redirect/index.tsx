import React from 'react';
import styled from 'styled-components';
import { useSelector } from '@suite/hooks/suite';
// import { useSelector, useActions } from '@suite/hooks/suite';
// import * as routerActions from '@suite-actions/routerActions';
// import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    height: 100%;
`;

const CoinmarketRedirect = () => {
    // const { goto } = useActions({ goto: routerActions.goto });
    const router = useSelector(state => state.router);
    console.log('router', router);
    // const cleanQuery = router.url.replace('/coinmarket-redirect#', '');

    // if (params[0] === 'buy') {
    // } else {
    //     return <Wrapper>Something is wrong - cannot redirect</Wrapper>;
    // }

    return <Wrapper>Redirecting</Wrapper>;
};

export default CoinmarketRedirect;
