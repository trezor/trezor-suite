import { BuyProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    type TradingTransactionBuy as TradingTxBuy,
    tradingBuyActions,
} from '@suite-common/trading';
import { Button } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { Account } from 'src/types/wallet';
import { TradingTransactionId } from 'src/views/wallet/trading/common';
import { TradingTransactionAmounts } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts';
import { TradingTransactionContainer } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionContainer';
import { TradingTransactionInfo } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionInfo';
import { TradingTransactionProvider } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionProvider';

interface TradingTransactionBuyProps {
    trade: TradingTxBuy;
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

    const { exchange, paymentMethod, paymentMethodName } = trade.data;

    const handleViewDetailsButtonClick = () => {
        dispatch(tradingBuyActions.saveTransactionId(trade.key ?? ''));
        dispatch(goto('wallet-trading-buy-detail'));
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
                <Button
                    size="small"
                    intent="neutral"
                    priority="secondary"
                    onClick={handleViewDetailsButtonClick}
                >
                    <Translation id="TR_TRADING_VIEW_DETAILS" />
                </Button>
            }
        />
    );
};
