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
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Err } from '@trezor/type-utils';

export type SerializedTx = { tx: string; symbol: NetworkSymbol };

export type TransactionType = WalletAccountTransaction['type'];

export type ComposeTransactionThunkArguments = {
    formState: FormState;
    composeContext: ComposeActionContext;
    isNetworkReserveEnabled?: boolean;
};

/**
 * A payment to an address a contact's Trezor attested. With it, the payer's Trezor checks the
 * attestation and shows the contact's name for the output instead of the bare address.
 */
export type ContactOutputAttestation = {
    address: string;
    /** The contact's x-only identity public key, hex. */
    contactPubkey: string;
    /** The contact's BIP-340 attestation of `address`, hex. */
    contactSignature: string;
};

export type SignTransactionThunkArguments = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedAccount: Account;
    device: TrezorDevice;
    paymentRequests?: PROTO.PaymentRequest[];
    /** Bitcoin only. */
    contactOutputs?: ContactOutputAttestation[];
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
    error: 'push-transaction-failed' | 'push-transaction-pending-conflict';
    metadata: Err<SerializedError>;
};

export type SendFormError =
    | ComposeFeeLevelsError
    | SignTransactionError
    | SignTransactionTimeoutError
    | PushTransactionError;
