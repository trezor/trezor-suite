import React from 'react';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { Props } from '@wallet-types/coinmarketSpend';
import Spend from './components/Spend';
import { useCoinmarketSpend, SpendContext } from '@wallet-hooks/useCoinmarketSpend';

const SpendLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketSpendContextValues = useCoinmarketSpend({
        ...props,
        selectedAccount,
    });

    return (
        <CoinmarketLayout>
            <SpendContext.Provider value={coinmarketSpendContextValues}>
                <Spend />
            </SpendContext.Provider>
        </CoinmarketLayout>
    );
};

const CoinmarketSpend = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        device: state.suite.device,
        language: state.suite.settings.language,
        fees: state.wallet.fees,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SPEND" account={selectedAccount} />;
    }

    return <SpendLoaded {...props} selectedAccount={selectedAccount} />;
};

export default CoinmarketSpend;
