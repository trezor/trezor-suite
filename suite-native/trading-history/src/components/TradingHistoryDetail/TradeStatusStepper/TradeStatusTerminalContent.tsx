import { useSelector } from 'react-redux';

import {
    type TradingTransaction,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToTransactionDetail } from '@suite-native/navigation';
import { TradeStatusProviderLink, TradeStatusSubItem } from '@suite-native/trading-atoms';
import { type TradingRootState } from '@suite-native/trading-state';
import { exhaustive } from '@trezor/type-utils';

import { TradeStatusCard } from './TradeStatusCard';
import { getTradeStatusUrl } from '../../../utils/tradeStatusUtils';

type TradeStatusTerminalContentProps = {
    trade: TradingTransaction;
};

const getTransactionId = (trade: TradingTransaction): string | undefined => {
    switch (trade.tradeType) {
        case 'buy':
            return trade.data.receiveTxHash;
        case 'sell':
            return trade.data.txid;
        case 'exchange':
            return trade.data.receiveTxHash;
        default:
            return exhaustive(trade);
    }
};

export const TradeStatusTerminalContent = ({ trade }: TradeStatusTerminalContentProps) => {
    const navigateToTransactionDetail = useNavigateToTransactionDetail();
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, trade.data.exchange ?? '', trade.tradeType),
    );

    const transactionId = getTransactionId(trade);
    const providerName = provider?.companyName ?? trade.data.exchange ?? '';
    const statusUrl = getTradeStatusUrl(trade);
    const hasTransactionId =
        !!transactionId && (trade.tradeType === 'sell' || trade.tradeType === 'exchange');
    const hasProviderStatusLink = !!statusUrl && !!providerName;
    const canOpenTransactionDetail = hasTransactionId && !!trade.sendAccountKey;

    if (!hasTransactionId && !hasProviderStatusLink) {
        return null;
    }

    const handleTxIdPress = () => {
        if (!transactionId || trade.tradeType === 'buy' || !trade.sendAccountKey) {
            return;
        }

        navigateToTransactionDetail({
            txid: transactionId,
            accountKey: trade.sendAccountKey,
        });
    };

    return (
        <TradeStatusCard>
            <VStack spacing="sp12" testID="@trade-status-stepper/terminal-content">
                {hasTransactionId && (
                    <TradeStatusSubItem
                        label={
                            <Translation id="moduleTrading.tradeHistory.detail.statusStepper.transactionId" />
                        }
                        value={transactionId}
                        onPress={canOpenTransactionDetail ? handleTxIdPress : undefined}
                    />
                )}
                {hasProviderStatusLink && (
                    <TradeStatusProviderLink
                        providerName={providerName}
                        statusUrl={statusUrl}
                        logo={provider?.logo}
                    />
                )}
            </VStack>
        </TradeStatusCard>
    );
};
