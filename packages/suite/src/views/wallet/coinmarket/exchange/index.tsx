import React from 'react';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { Props } from '@wallet-types/coinmarketExchangeForm';
import ExchangeForm from './components/ExchangeForm';
import {
    useCoinmarketExchangeForm,
    ExchangeFormContext,
} from '@wallet-hooks/useCoinmarketExchangeForm';

const CoinmarketExchangeLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        ...props,
        selectedAccount,
    });
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

const CoinmarketExchange = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        quotesRequest: state.wallet.coinmarket.exchange.quotesRequest,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
        fiat: state.wallet.fiat,
        device: state.suite.device,
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_EXCHANGE" account={selectedAccount} />;
    }

    return <CoinmarketExchangeLoaded {...props} selectedAccount={selectedAccount} />;
};

export default CoinmarketExchange;
