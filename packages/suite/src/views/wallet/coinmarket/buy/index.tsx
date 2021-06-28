import React from 'react';
import { AppState } from '@suite-types';
import { useCoinmarketBuyForm, BuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { ComponentProps, Props } from '@wallet-types/coinmarketBuyForm';
import { connect } from 'react-redux';
import BuyForm from './components/BuyForm';
import withDeviceConnected from '@wallet-views/coinmarket/hoc/withDeviceConnected';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
    quotesRequest: state.wallet.coinmarket.buy.quotesRequest,
    cachedAccountInfo: state.wallet.coinmarket.buy.cachedAccountInfo,
});

const CoinmarketBuyLoaded = withDeviceConnected((props: Props) => {
    const { selectedAccount } = props;
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ ...props, selectedAccount });

    return (
        <CoinmarketLayout>
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
});

const CoinmarketBuy = (props: ComponentProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={selectedAccount} />;
    }
    return <CoinmarketBuyLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(CoinmarketBuy);
