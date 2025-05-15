import { ExchangeProviderInfo } from 'invity-api';

import type { TradingTransactionExchange as TradingTxExchange } from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';
import { Button } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { Account } from 'src/types/wallet';
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
        dispatch(goto('wallet-trading-exchange-detail'));
    };

    useTradingWatchTrade({ account, trade });

    if (!trade.data.orderId) return null;

    return (
        <TradingTransactionContainer
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
                <Button size="small" variant="tertiary" onClick={viewDetail}>
                    <Translation id="TR_TRADING_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
