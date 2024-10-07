import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketDetailExchange } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchange';

const CoinmarketExchangeDetailComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount,
        tradeType: 'exchange',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailExchange />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketExchangeDetail = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_SWAP"
        backRoute="wallet-coinmarket-exchange"
        SectionComponent={CoinmarketExchangeDetailComponent}
    />
);
