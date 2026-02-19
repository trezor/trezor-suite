import { TrezorDevice } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    Account,
    ComposeActionContext,
    FormState,
    PrecomposedTransactionFinal,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { PROTO, TokenInfo, Unsuccessful } from '@trezor/connect';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { ERRORS as CONNECT_ERRORS } from '@trezor/connect-common/src/constants';

export type SerializedTx = { tx: string; symbol: NetworkSymbol };

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
