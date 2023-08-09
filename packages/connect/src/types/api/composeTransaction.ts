import type {
    AccountAddresses,
    Utxo as AccountUtxo,
    Address as AccountAddress,
} from '@trezor/blockchain-link';
import type {
    ComposeInput as ComposeInputBase,
    ComposeOutput as ComposeOutputBase,
    ComposeResultError as ComposeResultErrorBase,
    ComposeResultFinal as ComposeResultFinalBase,
    ComposeResultNonFinal as ComposeResultNonFinalBase,
} from '@trezor/utxo-lib';
import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

// for convenience ComposeOutput `type: "payment"` field is not required by @trezor/connect api
export type ComposeOutputPayment = Omit<Extract<ComposeOutputBase, { type: 'payment' }>, 'type'> & {
    type?: 'payment';
};

export type ComposeOutput = Exclude<ComposeOutputBase, { type: 'payment' }> | ComposeOutputPayment;

export interface ComposeParams {
    outputs: ComposeOutput[];
    coin: string;
    account?: undefined;
    feeLevels?: undefined;
    push?: boolean;
    sequence?: number;
    baseFee?: number;
    floorBaseFee?: boolean;
    skipPermutation?: boolean;
}

export type SignedTransaction = {
    signatures: string[];
    serializedTx: string;
    txid?: string;
};

// @trezor/utxo-lib `composeTx` ComposeInput required fields intersects AccountUtxo
export type ComposeUtxo = AccountUtxo & Partial<ComposeInputBase>;

export interface PrecomposeParams {
    outputs: ComposeOutput[];
    coin: string;
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
    skipPermutation?: boolean;
}

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
