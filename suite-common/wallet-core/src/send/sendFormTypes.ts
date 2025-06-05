import { TrezorDevice } from '@suite-common/suite-types';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import {
    Account,
    ExcludedUtxos,
    FeeInfo,
    FormState,
    PrecomposedTransactionFinal,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { ERRORS as CONNECT_ERRORS, PROTO, TokenInfo, Unsuccessful } from '@trezor/connect';

export type SerializedTx = { tx: string; symbol: NetworkSymbol };

// TODO: is this still needed?
export interface ComposeActionContext {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
    excludedUtxos?: ExcludedUtxos;
    prison?: Record<string, unknown>;
}

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: number;
    to: string;
    amount: string;
    data?: string;
    gasLimit: string;
    gasPrice: string;
    nonce: string;
};

export type TransactionType = WalletAccountTransaction['type'];

export type ComposeTransactionThunkArguments = {
    formState: FormState;
    composeContext: ComposeActionContext;
};

export type SignTransactionThunkArguments = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedAccount: Account;
    device: TrezorDevice;
    paymentRequests?: PROTO.TxAckPaymentRequest[];
};

export type ComposeFeeLevelsError = {
    error: 'fee-levels-compose-failed';
    message?: string;
};

export type SignTransactionError = {
    error: 'sign-transaction-failed';
    errorCode?: CONNECT_ERRORS.ErrorCode;
    message?: string;
};

export type SignTransactionTimeoutError = {
    error: 'sign-transaction-timeout';
    errorCode?: CONNECT_ERRORS.ErrorCode;
    message?: string;
};

export type PushTransactionError = {
    error: 'push-transaction-failed';
    metadata: Unsuccessful;
};

export type SendFormError =
    | ComposeFeeLevelsError
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError;
