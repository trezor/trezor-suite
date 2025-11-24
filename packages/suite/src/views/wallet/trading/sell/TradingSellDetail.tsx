import { useSelector } from 'src/hooks/suite';
import { TradingDetailContext, useTradingDetail } from 'src/hooks/wallet/trading/useTradingDetail';
import { UseTradingProps } from 'src/types/trading/trading';
import { getTradeProvider } from 'src/utils/wallet/trading/tradingUtils';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingDetailSell } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSell';

const TradingSellDetailLoaded = ({ selectedAccount }: UseTradingProps) => {
    const tradingDetailContext = useTradingDetail({
        account: selectedAccount.account,
        tradeType: 'sell',
    });

    const provider = getTradeProvider({
        trade: tradingDetailContext.trade?.data,
        providerInfo: tradingDetailContext.info?.providerInfos,
    });

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer SectionComponent={TradingDetailSell} provider={provider} />
        </TradingDetailContext.Provider>
    );
};

export const TradingSellDetail = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    return <TradingSellDetailLoaded selectedAccount={selectedAccount} />;
};
