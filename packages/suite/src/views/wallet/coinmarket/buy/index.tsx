import { useCoinmarketBuyForm, BuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import { withSelectedAccountLoaded } from 'src/components/wallet';
import BuyForm from './components/BuyForm';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import CoinmarketLayout from '../common/CoinmarketLayoutNew/CoinmarketLayout';
import CoinmarketFormLayout from '../common/CoinmarketForm/CoinmarketFormLayout';

const CoinmarketBuy = (props: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm(props);

    return (
        <CoinmarketLayout selectedAccount={props.selectedAccount}>
            <BuyFormContext.Provider value={coinmarketBuyContextValues}>
                <CoinmarketFormLayout />
                <BuyForm />
            </BuyFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketBuy, {
    title: 'TR_NAV_BUY',
});
