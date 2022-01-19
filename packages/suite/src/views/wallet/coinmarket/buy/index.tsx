import React from 'react';
import { useCoinmarketBuyForm, BuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import {
    CoinmarketLayout,
    WithSelectedAccountLoadedProps,
    withSelectedAccountLoaded,
} from '@wallet-components';
import BuyForm from './components/BuyForm';

const CoinmarketBuy = ({ selectedAccount }: WithSelectedAccountLoadedProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ selectedAccount });
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

export default withSelectedAccountLoaded(CoinmarketBuy, {
    title: 'TR_NAV_BUY',
});
