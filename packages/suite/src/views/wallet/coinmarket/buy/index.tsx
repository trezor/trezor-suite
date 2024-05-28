import { useCoinmarketBuyForm, BuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import { withSelectedAccountLoaded } from 'src/components/wallet';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';
import BuyForm from './components/BuyForm';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';

const CoinmarketBuy = (props: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm(props);
    const {
        isDraft,
        formState: { isDirty },
        handleClearFormButtonClick,
    } = coinmarketBuyContextValues;

    return (
        <CoinmarketLayout
            selectedAccount={props.selectedAccount}
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
