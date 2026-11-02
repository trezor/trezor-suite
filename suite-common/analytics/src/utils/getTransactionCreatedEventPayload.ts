import { type Account, type FormState, type FormStateTxType } from '@suite-common/wallet-types';

import { type TransactionCreatedEventAction } from '../events/transactionCreatedEvent';

type GetTransactionCreatedEventPayloadParams = {
    action: TransactionCreatedEventAction;
    account: Account;
    precomposedForm: FormState;
    tokens: string;
    txType?: FormStateTxType;
};

export const getTransactionCreatedEventPayload = ({
    action,
    account,
    precomposedForm,
    tokens,
    txType = precomposedForm.txType,
}: GetTransactionCreatedEventPayloadParams) => {
    const { options, selectedFee, outputs, isCoinControlEnabled, hasCoinControlBeenOpened } =
        precomposedForm;

    return {
        action,
        symbol: account.symbol,
        tokens,
        outputsCount: outputs.length,
        broadcast: options.includes('broadcast'),
        bitcoinLocktime: options.includes('bitcoinLocktime'),
        transactionData: options.includes('transactionData'),
        ethereumNonce: options.includes('ethereumNonce'),
        destinationTag: options.includes('destinationTag'),
        selectedFee: selectedFee || 'normal',
        isCoinControlEnabled,
        hasCoinControlBeenOpened,
        txType,
        ...(txType === 'send' && {
            accountIndex: account.index,
            accountType: account.accountType,
        }),
    };
};
