import React from 'react';
import { AppState } from '@suite-types';
import { useCoinmarketBuyForm, BuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { ComponentProps, Props } from '@wallet-types/coinmarketBuyForm';
import { connect } from 'react-redux';
import BuyForm from './components/BuyForm';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
});

const CoinmarketBuyLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ ...props, selectedAccount });
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketBuyContextValues;
    return (
        <CoinmarketLayout
            onClearFormButtonClick={isDirty || isDraft ? handleClearFormButtonClick : undefined}
        >
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
};

const CoinmarketBuy = (props: ComponentProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={selectedAccount} />;
    }
    return <CoinmarketBuyLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(CoinmarketBuy);
