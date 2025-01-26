import { BuyProviderInfo } from 'invity-api';

import { Button } from '@trezor/components';

import { saveTransactionDetailId } from 'src/actions/wallet/tradingBuyActions';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { TradeBuy } from 'src/types/wallet/tradingCommonTypes';
import { useDispatch } from 'src/hooks/suite';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingTransactionId } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionId';
import { TradingTransactionInfo } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionInfo';
import { TradingTransactionAmounts } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts';
import { TradingTransactionProvider } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionProvider';
import { TradingTransactionContainer } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionContainer';

interface TradingTransactionBuyProps {
    trade: TradeBuy;
    account: Account;
    providers?: {
        [name: string]: BuyProviderInfo;
    };
}

export const TradingTransactionBuy = ({
    trade,
    providers,
    account,
}: TradingTransactionBuyProps) => {
    const dispatch = useDispatch();
    const { navigateToBuyDetail } = useTradingNavigation(account);

    const { exchange, paymentMethod, paymentMethodName } = trade.data;

    const handleViewDetailsButtonClick = () => {
        dispatch(saveTransactionDetailId(trade.key || ''));
        navigateToBuyDetail();
    };

    useTradingWatchTrade({
        account,
        trade,
    });

    if (!trade.data.paymentId) return null;

    return (
        <TradingTransactionContainer
            TradeDetail={
                <>
                    <TradingTransactionAmounts trade={trade} />
                    <TradingTransactionInfo trade={trade} />
                    <TradingTransactionId transactionId={trade.data.paymentId} />
                </>
            }
            TradeProviders={
                <TradingTransactionProvider
                    exchange={exchange}
                    providers={providers}
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            }
            TradeButton={
                <Button size="small" variant="tertiary" onClick={handleViewDetailsButtonClick}>
                    <Translation id="TR_TRADING_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
