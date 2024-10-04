import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';

const CoinmarketBuyConfirmComponent = (props: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm({
        ...props,
        pageType: 'confirm',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketBuyContextValues}>
            <CoinmarketSelectedOffer />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketBuyConfirm = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketBuyConfirmComponent, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
