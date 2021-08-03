import React from 'react';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { Props } from '@wallet-types/coinmarketSellForm';
import SellForm from './components/SellForm';
import { useCoinmarketSellForm, SellFormContext } from '@wallet-hooks/useCoinmarketSellForm';

const CoinmarketSellLoaded = (props: Props) => {
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

const CoinmarketSell = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        quotesRequest: state.wallet.coinmarket.sell.quotesRequest,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
        fiat: state.wallet.fiat,
        device: state.suite.device,
        localCurrency: state.wallet.settings.localCurrency,
        fees: state.wallet.fees,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SELL" account={selectedAccount} />;
    }

    return <CoinmarketSellLoaded {...props} selectedAccount={selectedAccount} />;
};

export default CoinmarketSell;
