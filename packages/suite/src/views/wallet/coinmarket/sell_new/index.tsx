import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import CoinmarketFormLayout from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import CoinmarketLayout from 'src/views/wallet/coinmarket/common/CoinmarketLayoutNew/CoinmarketLayout';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';

const CoinmarketSell = (props: UseCoinmarketProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm(props);

    return (
        <CoinmarketLayout selectedAccount={props.selectedAccount}>
            <CoinmarketFormContext.Provider value={coinmarketSellContextValues}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSell, {
    title: 'TR_NAV_SELL',
});
