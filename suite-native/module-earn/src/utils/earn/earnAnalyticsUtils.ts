import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';

type ReportTransactionCreatedParams = {
    analytics: NativeAnalyticsDep['analytics'];
    symbol: NetworkSymbol;
    precomposedTransaction: PrecomposedTransactionFinal;
    formState: Pick<FormState, 'options' | 'selectedFee'>;
    txType: 'stake' | 'yield';
};

export const reportTransactionCreated = ({
    analytics,
    symbol,
    precomposedTransaction,
    formState,
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
            bitcoinLocktime: formState.options.includes('bitcoinLocktime'),
            transactionData: formState.options.includes('transactionData'),
            ethereumNonce: formState.options.includes('ethereumNonce'),
            destinationTag: formState.options.includes('destinationTag'),
            selectedFee: formState.selectedFee ?? 'normal',
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            txType,
        },
    });
