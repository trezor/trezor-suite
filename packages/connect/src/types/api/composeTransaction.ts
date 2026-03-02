import type {
    Address as AccountAddress,
    AccountAddresses,
    Utxo as AccountUtxo,
} from '@trezor/blockchain-link';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type {
    ComposeInput as ComposeInputBase,
    ComposeOutput as ComposeOutputBase,
    ComposeResultError as ComposeResultErrorBase,
    ComposeResultFinal as ComposeResultFinalBase,
    ComposeResultNonFinal as ComposeResultNonFinalBase,
    TransactionInputOutputSortingStrategy,
} from '@trezor/utxo-lib';

import type { Params, Response } from '../params';

// for convenience ComposeOutput `type: "payment"` field is not required by @trezor/connect api
export type ComposeOutputPayment = Omit<Extract<ComposeOutputBase, { type: 'payment' }>, 'type'> & {
    type?: 'payment';
};

export type ComposeOutput = Exclude<ComposeOutputBase, { type: 'payment' }> | ComposeOutputPayment;

export type ComposeParams = {
    outputs: ComposeOutput[];
    coin: string;
    identity?: string;
    account?: undefined;
    feeLevels?: undefined;
    push?: boolean;
    sequence?: number;
    baseFee?: number;
    floorBaseFee?: boolean;
    sortingStrategy?: TransactionInputOutputSortingStrategy;
};

export type SignedTransaction = {
    signatures: string[];
    serializedTx: string;
    txid?: string;
};

// @trezor/utxo-lib `composeTx` ComposeInput required fields intersects AccountUtxo
export type ComposeUtxo = AccountUtxo & Partial<ComposeInputBase>;

export type PrecomposeParams = {
    outputs: ComposeOutput[];
    coin: string;
    identity?: string;
    account: {
        path: string;
        addresses: AccountAddresses;
        utxo: ComposeUtxo[];
    };
    feeLevels: { feePerUnit: string }[];
    push?: undefined;
    baseFee?: number;
    floorBaseFee?: boolean;
    sequence?: number;
    sortingStrategy?: TransactionInputOutputSortingStrategy;
};

// @trezor/utxo-lib `composeTx` transaction.input (ComposeInput) response intersects AccountUtxo
export type ComposedInputs = AccountUtxo & ComposeInputBase;

// @trezor/connect api returns additional errors
export type ComposeResultError =
    | ComposeResultErrorBase
    | {
          type: 'error';
          error: 'ADDRESSES-NOT-SET';
      };

export type ComposeResultFinal = ComposeResultFinalBase<
    ComposedInputs,
    ComposeOutputBase,
    AccountAddress
>;

export type ComposeResultNonFinal = ComposeResultNonFinalBase<ComposedInputs>;

export type ComposeResult = ComposeResultError | ComposeResultNonFinal | ComposeResultFinal;

export type PrecomposeResultError = ComposeResultError;

export type PrecomposeResultNonFinal = Omit<ComposeResultNonFinal, 'inputs'> & {
    inputs: PROTO.TxInputType[];
};

export type PrecomposeResultFinal = Omit<ComposeResultFinal, 'inputs' | 'outputs'> & {
    inputs: PROTO.TxInputType[];
    outputs: PROTO.TxOutputType[];
};

export type PrecomposedResult =
    | PrecomposeResultError
    | PrecomposeResultNonFinal
    | PrecomposeResultFinal;

export declare function composeTransaction(
    params: Params<ComposeParams>,
): Response<SignedTransaction>;

export declare function composeTransaction(
    params: Params<PrecomposeParams>,
): Response<PrecomposedResult[]>;
