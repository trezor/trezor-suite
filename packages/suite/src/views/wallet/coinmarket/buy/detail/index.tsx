import React from 'react';
import { AppState } from '@suite-types';
import {
    useCoinmarketBuyDetail,
    CoinmarketBuyDetailContext,
} from '@wallet-hooks/useCoinmarketBuyDetail';
import { WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { ComponentProps, Props } from '@wallet-types/coinmarketBuyDetail';
import { connect } from 'react-redux';

import Detail from './Detail';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
    trades: state.wallet.coinmarket.trades,
    transactionId: state.wallet.coinmarket.buy.transactionId,
});

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

const DetailIndex = (props: ComponentProps) => {
    const { selectedAccount } = props;

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }
    return <DetailIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(DetailIndex);
