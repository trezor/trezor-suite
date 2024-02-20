import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import ExchangeForm from './components/ExchangeForm';
import {
    useCoinmarketExchangeForm,
    ExchangeFormContext,
} from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';

const CoinmarketExchange = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketExchangeContextValues;

    return (
        <CoinmarketLayout
            selectedAccount={props.selectedAccount}
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
