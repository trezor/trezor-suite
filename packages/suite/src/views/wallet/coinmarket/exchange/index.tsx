import React from 'react';
import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
import ExchangeForm from './components/ExchangeForm';
import {
    useCoinmarketExchangeForm,
    ExchangeFormContext,
} from '@wallet-hooks/useCoinmarketExchangeForm';

const CoinmarketExchange = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketExchangeContextValues;
    return (
        <CoinmarketLayout
            onClearFormButtonClick={isDirty || isDraft ? handleClearFormButtonClick : undefined}
        >
            <ExchangeFormContext.Provider value={coinmarketExchangeContextValues}>
                <ExchangeForm />
            </ExchangeFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketExchange, {
    title: 'TR_NAV_EXCHANGE',
});
