import type {
    AccountAddresses,
    Utxo as AccountUtxo,
    Address as AccountAddress,
} from '@trezor/blockchain-link';
import type {
    ComposeInput,
    ComposeOutput,
    ComposeResult,
    ComposeResultFinal,
    ComposeResultNonFinal,
    ComposeResultError,
} from '@trezor/utxo-lib';
import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export type { ComposeOutput } from '@trezor/utxo-lib';

// for convenience `type: "payment"` field is not required by @trezor/connect api
export type ComposePaymentOutput = Omit<Extract<ComposeOutput, { type: 'payment' }>, 'type'> & {
    type?: 'payment';
};

export type ComposeOutputParam = Exclude<ComposeOutput, { type: 'payment' }> | ComposePaymentOutput;

export interface ComposeParams {
    outputs: ComposeOutputParam[];
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

// @trezor/utxo-lib `composeTx` utxo param intersects AccountUtxo
export type ComposeUtxo = AccountUtxo & Partial<ComposeInput>;

export interface PrecomposeParams {
    outputs: ComposeOutputParam[];
    coin: string;
    account: {
        path: string;
        addresses: AccountAddresses;
        utxos: ComposeUtxo[];
    };
    feeLevels: { feePerUnit: string }[];
    push?: undefined;
    baseFee?: number;
    floorBaseFee?: boolean;
    sequence?: number;
    skipPermutation?: boolean;
}

// @trezor/utxo-lib `composeTx` transaction.input response intersects AccountUtxo
export type ComposedInputs = AccountUtxo & ComposeInput;

export type PrecomposeResult = ComposeResult<ComposedInputs, ComposeOutput, AccountAddress>;

export type PrecomposeResultFinal = ComposeResultFinal<
    ComposedInputs,
    ComposeOutput,
    AccountAddress
>;

export type PrecomposedTransaction =
    | ComposeResultError
    | ComposeResultNonFinal
    | (Omit<PrecomposeResultFinal, 'transaction'> & {
          transaction: {
              inputs: PROTO.TxInputType[];
              outputs: PROTO.TxOutputType[];
              outputsPermutation: number[];
          };
      });

export declare function composeTransaction(
    params: Params<ComposeParams>,
): Response<SignedTransaction>;

export declare function composeTransaction(
    params: Params<PrecomposeParams>,
): Response<PrecomposedTransaction[]>;
