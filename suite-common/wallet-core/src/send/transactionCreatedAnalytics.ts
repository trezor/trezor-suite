import {
    type TransactionCreatedEventAction,
    type TransactionCreatedEventTxType,
} from '@suite-common/analytics';
import { type Account, type FormState } from '@suite-common/wallet-types';

type TransactionCreatedEventPayloadParams = {
    action: TransactionCreatedEventAction;
    account: Pick<Account, 'symbol' | 'index' | 'accountType'>;
    precomposedForm: FormState;
    tokens: string;
    txType: TransactionCreatedEventTxType | undefined;
};

const isTradingTxType = (txType: TransactionCreatedEventTxType | undefined) =>
    txType === 'trade-cex' || txType === 'trade-dex';

export const getTransactionCreatedEventPayload = ({
    action,
    account,
    precomposedForm,
    tokens,
    txType,
}: TransactionCreatedEventPayloadParams) => {
    const { options, selectedFee } = precomposedForm;

    return {
        action,
        symbol: account.symbol,
        tokens,
        outputsCount: precomposedForm.outputs.length,
        broadcast: options.includes('broadcast'),
        bitcoinLocktime: options.includes('bitcoinLocktime'),
        transactionData: options.includes('transactionData'),
        ethereumNonce: options.includes('ethereumNonce'),
        destinationTag: options.includes('destinationTag'),
        selectedFee: selectedFee || 'normal',
        isCoinControlEnabled: precomposedForm.isCoinControlEnabled,
        hasCoinControlBeenOpened: precomposedForm.hasCoinControlBeenOpened,
        txType,
        ...(isTradingTxType(txType) && {
            accountIndex: account.index,
            accountType: account.accountType,
        }),
    };
};
