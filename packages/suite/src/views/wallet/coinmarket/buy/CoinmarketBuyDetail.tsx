import { withSelectedAccountLoaded } from 'src/components/wallet';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketDetailBuy } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuy';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const CoinmarketBuyDetailComponent = (props: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount: props.selectedAccount,
        tradeType: 'buy',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailBuy />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketBuyDetail = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketBuyDetailComponent, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
