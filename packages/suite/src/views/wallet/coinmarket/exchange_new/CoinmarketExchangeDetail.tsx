import { withSelectedAccountLoaded } from 'src/components/wallet';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketDetailExchange } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchange';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const CoinmarketExchangeDetailComponent = (props: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount: props.selectedAccount,
        tradeType: 'exchange',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailExchange />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketExchangeDetail = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketExchangeDetailComponent, {
        backRoute: 'wallet-coinmarket-exchange',
    }),
    {
        title: 'TR_COINMARKET_SWAP',
    },
);
