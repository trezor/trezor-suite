import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { getRedirectParams } from '@suite-utils/router';
import { useSelector, useActions } from '@suite/hooks/suite';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    height: 100%;
`;

interface BuyParams {
    route: 'buy';
    symbol: Account['symbol'];
    accountType: Account['accountType'];
    accountIndex: Account['index'];
    coinmarketTransactionId: string;
}

const Redirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    const router = useSelector(state => state.router);
    const cleanQuery = router.url.replace('/redirect#?', '');
    const params: BuyParams = getRedirectParams(cleanQuery);

    if (
        params.route === 'buy' &&
        params.accountType &&
        params.accountIndex &&
        params.coinmarketTransactionId &&
        params.symbol
    ) {
        const { accountIndex, coinmarketTransactionId, accountType, symbol } = params;

        goto('wallet-coinmarket-buy-offers', {
            symbol,
            accountType,
            accountIndex,
            coinmarketTransactionId,
        });
    } else {
        return <Wrapper>Something is wrong - cannot redirect</Wrapper>;
    }

    return <Wrapper>Redirecting</Wrapper>;
};

export default Redirect;
