import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketDetailBuy } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuy';

const CoinmarketBuyDetailComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount,
        tradeType: 'buy',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <CoinmarketDetailBuy />
        </CoinmarketDetailContext.Provider>
    );
};

export const CoinmarketBuyDetail = () => (
    <CoinmarketContainer
        title="TR_NAV_BUY"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketBuyDetailComponent}
    />
);
