import React from 'react';
import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
import SellForm from './components/SellForm';
import { useCoinmarketSellForm, SellFormContext } from '@wallet-hooks/useCoinmarketSellForm';

const CoinmarketSell = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketSellContextValues;
    return (
        <CoinmarketLayout
            onClearFormButtonClick={isDirty || isDraft ? handleClearFormButtonClick : undefined}
        >
            <SellFormContext.Provider value={coinmarketSellContextValues}>
                <SellForm />
            </SellFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSell, {
    title: 'TR_NAV_SELL',
});
