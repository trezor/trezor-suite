import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeeLevelLabel, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';

type ReportTransactionCreatedParams = {
    analytics: NativeAnalyticsDep['analytics'];
    symbol: NetworkSymbol;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedFee: FeeLevelLabel | undefined;
    txType: 'stake' | 'yield';
};

export const reportTransactionCreated = ({
    analytics,
    symbol,
    precomposedTransaction,
    selectedFee,
    txType,
}: ReportTransactionCreatedParams) =>
    analytics.report({
        type: events.transactionCreatedEvent.name,
        payload: {
            action: 'sent',
            symbol,
            tokens: '',
            outputsCount: precomposedTransaction.outputs.length,
            broadcast: true,
            bitcoinLocktime: false,
            transactionData: false,
            ethereumNonce: false,
            destinationTag: false,
            selectedFee: selectedFee ?? 'normal',
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            txType,
        },
    });
