import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';

const CoinmarketSellConfirmComponent = (props: UseCoinmarketProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm({
        ...props,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketSellContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketSellConfirm = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketSellConfirmComponent, {
        backRoute: 'wallet-coinmarket-sell',
    }),
    {
        title: 'TR_NAV_SELL',
    },
);
