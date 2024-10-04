import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketLayout } from '../common/CoinmarketLayoutNew/CoinmarketLayout';
import { CoinmarketFormLayout } from '../common/CoinmarketForm/CoinmarketFormLayout';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

const CoinmarketBuyComponent = (props: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm(props);

    return (
        <CoinmarketLayout selectedAccount={props.selectedAccount}>
            <CoinmarketFormContext.Provider value={coinmarketBuyContextValues}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export const CoinmarketBuyForm = withSelectedAccountLoaded(CoinmarketBuyComponent, {
    title: 'TR_NAV_BUY',
});
