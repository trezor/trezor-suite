import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketDetailSell } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailSell/CoinmarketDetailSell';

const CoinmarketSellDetailComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount,
        tradeType: 'sell',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailSell />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketSellDetail = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_BUY_AND_SELL"
        backRoute="wallet-coinmarket-transactions"
        SectionComponent={CoinmarketSellDetailComponent}
    />
);
