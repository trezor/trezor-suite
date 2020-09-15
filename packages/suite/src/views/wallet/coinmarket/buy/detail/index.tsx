import React from 'react';
import { AppState } from '@suite-types';
import {
    useCoinmarketDetail,
    CoinmarketBuyDetailContext,
} from '@wallet-hooks/useCoinmarketBuyDetail';
import { WalletLayout } from '@wallet-components';
import { ComponentProps } from '@wallet-types/coinmarketBuyDetail';
import { connect } from 'react-redux';

import Detail from './Detail';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
    trades: state.wallet.coinmarket.trades,
    transactionId: state.wallet.coinmarket.buy.transactionId,
});

const DetailIndex = (props: ComponentProps) => {
    const { selectedAccount } = props;

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const coinmarketBuyContextValues = useCoinmarketDetail({ ...props, selectedAccount });

    return (
        <CoinmarketBuyDetailContext.Provider value={coinmarketBuyContextValues}>
            <Detail />
        </CoinmarketBuyDetailContext.Provider>
    );
};

export default connect(mapStateToProps)(DetailIndex);
