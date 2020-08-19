import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
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

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    return <Wrapper>detail for {transactionId}</Wrapper>;
};

export default Detail;
