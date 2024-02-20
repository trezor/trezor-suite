import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { useCoinmarketSellForm, SellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';
import SellForm from './components/SellForm';

const CoinmarketSell = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketSellContextValues;

    return (
        <CoinmarketLayout
            selectedAccount={props.selectedAccount}
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
