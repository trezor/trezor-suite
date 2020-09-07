import React from 'react';
import { AppState } from '@suite-types';
import { useBuyForm, BuyFormContext } from '@wallet-hooks/useBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { BuyFormProps } from '@wallet-types/buyForm';
import { connect } from 'react-redux';
import BuyForm from './components/BuyForm';

const mapStateToProps = (state: AppState): BuyFormProps => ({
    selectedAccount: state.wallet.selectedAccount,
    quotesRequest: state.wallet.coinmarket.buy.quotesRequest,
    cachedAccountInfo: state.wallet.coinmarket.buy.cachedAccountInfo,
});

const CoinmarketBuy = (props: BuyFormProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const coinmarketBuyContextValues = useBuyForm({ ...props, selectedAccount });

    return (
        <CoinmarketLayout>
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default connect(mapStateToProps)(CoinmarketBuy);
