import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
// import useSWR from 'swr';
// import invityApi from '@suite/services/invityAPI';
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
    const { setLayout } = useContext(LayoutContext);
    // const [counter, incrementCounter] = useState<number>(0);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    // const { data, error } = useSWR(
    //     `${invityApi.server}/api/buy/watch/${counter}`,
    //     fetch(url, {
    //         method: 'POST',
    //         body: JSON.stringify(data),
    //     }).then(r => r.json()),
    // );

    // console.log('data', data);
    // console.log('error', error);

    return <Wrapper>detail for {transactionId}</Wrapper>;
};

export default Detail;
