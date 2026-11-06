import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type ComposeActionContext,
    type FormState,
    type PrecomposedTransactionFinal,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type PROTO } from '@trezor/connect';
import { type ERRORS as CONNECT_ERRORS } from '@trezor/connect-common/src/constants';

export type SerializedTx = { tx: string; symbol: NetworkSymbol };

export type TransactionType = WalletAccountTransaction['type'];

export type ComposeTransactionThunkArguments = {
    formState: FormState;
    composeContext: ComposeActionContext;
    isNetworkReserveEnabled?: boolean;
};

export type SignTransactionThunkArguments = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedAccount: Account;
    device: TrezorDevice;
    paymentRequests?: PROTO.PaymentRequest[];
};

export type ComposeFeeLevelsError = {
    error: 'fee-levels-compose-failed';
    message?: string;
};

export type EnhanceTransactionError = {
    error: 'enhance-transaction-failed';
    message: string;
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
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    errorCode?: CONNECT_ERRORS.ErrorCode;
    message?: string;
};

export type SendFormError =
    | ComposeFeeLevelsError
    | EnhanceTransactionError
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError;
