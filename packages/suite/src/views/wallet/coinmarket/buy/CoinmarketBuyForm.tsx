import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayout';

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
