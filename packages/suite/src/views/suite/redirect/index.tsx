import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { getRedirectParams } from '@suite-utils/router';
import { useSelector, useActions } from '@suite/hooks/suite';
import * as routerActions from '@suite-actions/routerActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';

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
    transactionId: string;
}

const Redirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    const { saveTransactionId } = useActions({
        saveTransactionId: coinmarketBuyActions.saveTransactionId,
    });
    const router = useSelector(state => state.router);
    const cleanQuery = router.url.replace('/redirect#?', '');
    const params: BuyParams = getRedirectParams(cleanQuery);

    // http://localhost:3000/redirect#?route=buy&symbol=btc&accountType=normal&accountIndex=0&transactionId=f4375676-60df-42c7-b4f5-13437b014fbc

    if (
        params.route === 'buy' &&
        params.accountType &&
        params.accountIndex &&
        params.transactionId &&
        params.symbol
    ) {
        const { accountIndex, transactionId, accountType, symbol } = params;

        saveTransactionId(transactionId);
        goto('wallet-coinmarket-buy-detail', {
            symbol,
            accountType,
            accountIndex,
        });
    } else {
        return <Wrapper>Something is wrong - cannot redirect</Wrapper>;
    }

    return <Wrapper>Redirecting</Wrapper>;
};

export default Redirect;
