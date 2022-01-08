import React from 'react';
import { useSelector } from '@suite-hooks';
import { useCoinmarketBuyForm, BuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import BuyForm from './components/BuyForm';
import type { Props } from '@wallet-types/coinmarketBuyForm';

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

const CoinmarketBuy = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
    }));
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={selectedAccount} />;
    }
    return <CoinmarketBuyLoaded {...props} selectedAccount={selectedAccount} />;
};

export default CoinmarketBuy;
