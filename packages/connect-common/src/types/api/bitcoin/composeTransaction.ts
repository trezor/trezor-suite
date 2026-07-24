import type {
    Address as AccountAddress,
    AccountAddresses,
    Utxo as AccountUtxo,
} from '@trezor/blockchain-link';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type {
    ComposeInput as ComposeInputBase,
    ComposeOutput as ComposeOutputBase,
    ComposeResultError as ComposeResultErrorBase,
    ComposeResultFinal as ComposeResultFinalBase,
    ComposeResultNonFinal as ComposeResultNonFinalBase,
} from '@trezor/utxo-lib';

import type { ComposeParams } from './common';
import type { Params, Response } from '../../params';

// @trezor/utxo-lib `composeTx` ComposeInput required fields intersects AccountUtxo
export type ComposeUtxo = AccountUtxo & Partial<ComposeInputBase>;

export type PrecomposeParams = ComposeParams & {
    account: {
        path: string;
        addresses: AccountAddresses;
        utxo: ComposeUtxo[];
    };
    feeLevels: { feePerUnit: string }[];
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
    params: Params<PrecomposeParams>,
): Response<PrecomposedResult[]>;
