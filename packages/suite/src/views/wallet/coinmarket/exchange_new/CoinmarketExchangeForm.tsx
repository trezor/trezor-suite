import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import CoinmarketLayout from 'src/views/wallet/coinmarket/common/CoinmarketLayoutNew/CoinmarketLayout';

const CoinmarketExchangeFormComponent = (props: UseCoinmarketProps) => {
    const coinmarketExchangeContextValue = useCoinmarketExchangeForm(props);

    return (
        <CoinmarketLayout selectedAccount={props.selectedAccount}>
            <CoinmarketFormContext.Provider value={coinmarketExchangeContextValue}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export const CoinmarketExchangeForm = withSelectedAccountLoaded(CoinmarketExchangeFormComponent, {
    title: 'TR_COINMARKET_SWAP',
});
