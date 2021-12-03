import React from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import {
    useCoinmarketBuyDetail,
    CoinmarketBuyDetailContext,
} from '@wallet-hooks/useCoinmarketBuyDetail';
import Detail from './Detail';
import type { Props } from '@wallet-types/coinmarketBuyDetail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndexLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketBuyContextValues = useCoinmarketBuyDetail({ ...props, selectedAccount });

    return (
        <CoinmarketBuyDetailContext.Provider value={coinmarketBuyContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketBuyDetailContext.Provider>
    );
};

const DetailIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        trades: state.wallet.coinmarket.trades,
        transactionId: state.wallet.coinmarket.buy.transactionId,
    }));

    if (props.selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={props.selectedAccount} />;
    }
    return <DetailIndexLoaded {...props} selectedAccount={props.selectedAccount} />;
};

export default DetailIndex;
