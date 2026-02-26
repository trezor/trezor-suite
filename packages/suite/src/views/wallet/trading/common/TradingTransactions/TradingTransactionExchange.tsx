import { type ExchangeProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import type { TradingTransactionExchange as TradingTxExchange } from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';
import { Button } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { type Account } from 'src/types/wallet';
import { TradingTransactionId } from 'src/views/wallet/trading/common';
import { TradingTransactionAmounts } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts';
import { TradingTransactionContainer } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionContainer';
import { TradingTransactionInfo } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionInfo';
import { TradingTransactionProvider } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionProvider';

interface TradingTransactionExchangeProps {
    trade: TradingTxExchange;
    account: Account;
    providers?: {
        [name: string]: ExchangeProviderInfo;
    };
}

export const TradingTransactionExchange = ({
    trade,
    providers,
    account,
}: TradingTransactionExchangeProps) => {
    const dispatch = useDispatch();

    const viewDetail = () => {
        dispatch(tradingExchangeActions.saveTransactionId(trade.key || ''));
        dispatch(goto({ routeName: 'wallet-trading-exchange-detail' }));
    };

    useTradingWatchTrade({ account, trade });

    if (!trade.data.orderId) return null;

    return (
        <TradingTransactionContainer
            data-testid={`@trading/transactions/list/swap-transaction/${trade.data.orderId}`}
            TradeDetail={
                <>
                    <TradingTransactionAmounts trade={trade} />
                    <TradingTransactionInfo trade={trade} />
                    <TradingTransactionId transactionId={trade.data.orderId} />
                </>
            }
            TradeProviders={
                <TradingTransactionProvider exchange={trade.data.exchange} providers={providers} />
            }
            TradeButton={
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={viewDetail}
                    data-testid="@trading/transactions/view-details-button"
                >
                    <Translation id="TR_TRADING_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
