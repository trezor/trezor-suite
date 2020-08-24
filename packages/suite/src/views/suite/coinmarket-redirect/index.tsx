import React from 'react';
import styled from 'styled-components';
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

const CoinmarketRedirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    const { saveTransactionId } = useActions({
        saveTransactionId: coinmarketBuyActions.saveTransactionId,
    });
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const router = useSelector(state => state.router);
    const cleanQuery = router.url.replace('/coinmarket-redirect#', '');
    const params = cleanQuery.split('/');

    // http://localhost:3000/coinmarket-redirect#buy/663cb981-d399-4a12-9911-5a304d1f24f7
    if (params[0] === 'buy') {
        const trade = trades.find(trade => trade.tradeType === 'buy' && trade.key === params[1]);
        if (trade && trade.tradeType === 'buy') {
            saveTransactionId(params[1]);
            goto('wallet-coinmarket-buy-detail', {
                symbol: trade.account.symbol,
                accountType: trade.account.accountType,
                accountIndex: trade.account.accountIndex,
            });
        }
    } else {
        return <Wrapper>Something is wrong - cannot redirect</Wrapper>;
    }

    return <Wrapper>Redirecting</Wrapper>;
};

export default CoinmarketRedirect;
