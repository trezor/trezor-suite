import { withSelectedAccountLoaded } from 'src/components/wallet';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketDetailSell } from '../common/CoinmarketDetail/CoinmarketDetailSell/CoinmarketDetailSell';

const CoinmarketSellDetailComponent = (props: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount: props.selectedAccount,
        tradeType: 'sell',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailSell />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketSellDetail = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketSellDetailComponent, {
        backRoute: 'wallet-coinmarket-sell',
    }),
    {
        title: 'TR_NAV_SELL',
    },
);
