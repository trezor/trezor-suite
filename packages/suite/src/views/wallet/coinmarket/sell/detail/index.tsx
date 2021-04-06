import React from 'react';
import {
    useCoinmarketSellDetail,
    CoinmarketSellDetailContext,
} from '@wallet-hooks/useCoinmarketSellDetail';
import { useSelector } from '@suite-hooks';
import { WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { Props } from '@wallet-types/coinmarketSellDetail';

import Detail from './Detail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndexLoaded = (props: Props) => {
    const coinmarketSellContextValues = useCoinmarketSellDetail(props);

    return (
        <CoinmarketSellDetailContext.Provider value={coinmarketSellContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketSellDetailContext.Provider>
    );
};

const DetailIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.sell.transactionId,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SELL" account={selectedAccount} />;
    }
    return <DetailIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default DetailIndex;
