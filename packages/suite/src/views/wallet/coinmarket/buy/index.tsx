import React from 'react';
import { AppState } from '@suite-types';
import { useCoinmarketBuyForm, BuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { ComponentProps } from '@wallet-types/coinmarketBuyForm';
import { connect } from 'react-redux';
import BuyForm from './components/BuyForm';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
    quotesRequest: state.wallet.coinmarket.buy.quotesRequest,
    cachedAccountInfo: state.wallet.coinmarket.buy.cachedAccountInfo,
});

const CoinmarketBuy = (props: ComponentProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ ...props, selectedAccount });

    return (
        <CoinmarketLayout>
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default connect(mapStateToProps)(CoinmarketBuy);
