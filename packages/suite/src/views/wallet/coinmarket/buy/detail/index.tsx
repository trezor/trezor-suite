import React, { useMemo, useContext, useState } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import useSWR from 'swr';
import invityApi from '@suite/services/invityAPI';
import { CoinmarketTopPanel } from '@wallet-components';
import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Detail = () => {
    const transactionId = useSelector(state => state.wallet.coinmarket.buy.transactionId);
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const { setLayout } = useContext(LayoutContext);
    const trade = trades.find(
        trade => trade.tradeType === 'buy' && trade.data.paymentId === transactionId,
    );

    const [counter, setCounter] = useState<number>(0);
    const apiHeader = process.env.SUITE_TYPE === 'desktop' ? 'X-SuiteA-Api' : 'X-SuiteW-Api';

    const fetcher = (url: string) =>
        fetch(url, {
            method: 'POST',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                [apiHeader]: 'token',
            },
            body: JSON.stringify(trade ? trade.data : null),
        }).then(r => {
            r.json();
        });

    const { data, error } = useSWR(`${invityApi.server}/api/buy/watch/${counter}`, fetcher);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    console.log('data', data);
    console.log('error', error);

    return <Wrapper>detail for {transactionId}</Wrapper>;
};

export default Detail;
