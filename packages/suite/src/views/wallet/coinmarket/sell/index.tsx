import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from 'src/components/wallet';
import SellForm from './components/SellForm';
import { useCoinmarketSellForm, SellFormContext } from 'src/hooks/wallet/useCoinmarketSellForm';

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
