import React from 'react';
import { AppState } from '@suite-types';
import { useBuyForm, BuyFormContext } from '@wallet-hooks/useBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { BuyFormProps } from '@wallet-types/buyForm';
import { connect } from 'react-redux';
import BuyForm from './components/BuyForm';

const mapStateToProps = (state: AppState): BuyFormProps => ({
    selectedAccount: state.wallet.selectedAccount,
});

const CoinmarketBuy = (props: BuyFormProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const coinmarketBuyContextValues = useBuyForm({ selectedAccount });

    return (
        <CoinmarketLayout>
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default connect(mapStateToProps)(CoinmarketBuy);
