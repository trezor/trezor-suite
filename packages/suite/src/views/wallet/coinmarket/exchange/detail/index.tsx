import React from 'react';
import {
    useCoinmarketExchangeDetail,
    CoinmarketExchangeDetailContext,
} from '@wallet-hooks/useCoinmarketExchangeDetail';
import { useSelector } from '@suite-hooks';
import { WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { Props } from '@wallet-types/coinmarketExchangeDetail';

import Detail from './Detail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndexLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketExchangeContextValues = useCoinmarketExchangeDetail({
        ...props,
        selectedAccount,
    });

    return (
        <CoinmarketExchangeDetailContext.Provider value={coinmarketExchangeContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketExchangeDetailContext.Provider>
    );
};

const DetailIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.exchange.transactionId,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_EXCHANGE" account={selectedAccount} />;
    }
    return <DetailIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default DetailIndex;
