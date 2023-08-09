import type { Network } from '../networks';
import type { CoinSelectPaymentType } from './coinselect';

// UTXO == unspent transaction output = all I can spend
export interface ComposeInput {
    vout: number; // index of output IN THE TRANSACTION
    txid: string; // hash of the transaction
    amount: string; // how much money sent
    coinbase: boolean; // coinbase transaction = utxo from mining, cannot be spend before 100 blocks
    own: boolean; // is the ORIGIN me (the same account)
    confirmations: number; // might be spent immediately (own) or after 6 conf (not own) see ./coinselect/tryConfirmed
    required?: boolean; // must be included into transaction
}

// Output parameter of coinselect algorithm which is either:
//    - 'payment' - address and amount
//    - 'payment-noaddress' - just amount
//    - 'send-max' - address
//    - 'send-max-noaddress' - no other info
//    - 'opreturn' - dataHex
export interface ComposeOutputPayment {
    type: 'payment';
    address: string;
    amount: string;
}

export interface ComposeOutputPaymentNoAddress {
    type: 'payment-noaddress';
    amount: string;
}

export interface ComposeOutputSendMax {
    type: 'send-max'; // only one in TX request
    address: string;
    amount?: typeof undefined;
}

export interface ComposeOutputSendMaxNoAddress {
    type: 'send-max-noaddress';
    amount?: typeof undefined;
}

export interface ComposeOutputOpreturn {
    type: 'opreturn'; // it doesn't need to have address
    dataHex: string;
    amount?: typeof undefined;
    address?: typeof undefined;
}

// NOTE: this interface **is not** accepted by ComposeRequest['utxos']
// it's optionally created by the process from parameters (basePath + changeId + changeAddress)
// but it's returned in ComposedTransaction['outputs']
export interface ComposeOutputChange {
    type: 'change';
    path: number[];
    amount: string;
}

export type ComposeFinalOutput =
    | ComposeOutputPayment
    | ComposeOutputSendMax
    | ComposeOutputOpreturn;

export type ComposeNotFinalOutput = ComposeOutputPaymentNoAddress | ComposeOutputSendMaxNoAddress;

export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export interface ComposeRequest<Input extends ComposeInput, Output extends ComposeOutput> {
    txType?: CoinSelectPaymentType;
    utxos: Input[]; // all inputs
    outputs: Output[]; // all outputs
    feeRate: string | number; // in sat/byte, virtual size
    longTermFeeRate?: string | number; // dust output feeRate multiplier in sat/byte, virtual size
    basePath: number[]; // for trezor inputs
    network: Network;
    changeId: number;
    changeAddress: string;
    dustThreshold: number; // explicit dust threshold, in satoshi
    baseFee?: number; // DOGE or RBF base fee
    floorBaseFee?: boolean; // DOGE floor base fee to the nearest integer
    skipUtxoSelection?: boolean; // use custom utxo selection, without algorithm
    skipPermutation?: boolean; // Do not sort inputs/outputs and preserve the given order. Handy for RBF.
}

type ComposedTransactionOutputs<T> = T extends ComposeOutputSendMax
    ? Omit<T, 'type'> & ComposeOutputPayment // NOTE: replace ComposeOutputSendMax (no amount) with ComposeOutputPayment (with amount)
    : T extends ComposeFinalOutput
    ? T
    : never;

export interface ComposedTransaction<Input extends ComposeInput, Output extends ComposeOutput> {
    inputs: Input[];
    outputs: {
        sorted: (ComposedTransactionOutputs<Output> | ComposeOutputChange)[];
        permutation: number[];
    };
}

// Result from `composeTx` module
// 'nonfinal' - contains partial info about the inputs/outputs but not the transaction data
// 'final' - contains all info about the inputs/outputs and transaction data
// 'error' - validation or runtime error. expected error types are listed below

export const COMPOSE_ERROR_TYPES = [
    'MISSING-UTXOS',
    'MISSING-OUTPUTS',
    'INCORRECT-OUTPUT-TYPE',
    'INCORRECT-FEE-RATE',
    'TWO-SEND-MAX',
    'NOT-ENOUGH-FUNDS',
] as const;

export type ComposeResultError =
    | {
          type: 'error';
          error: (typeof COMPOSE_ERROR_TYPES)[number];
      }
    | {
          type: 'error';
          error: 'COINSELECT';
          message: string;
      };

export interface ComposeResultNonFinal {
    type: 'nonfinal';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
    fee: string;
    feePerByte: string;
    bytes: number;
}

export interface ComposeResultFinal<Input extends ComposeInput, Output extends ComposeOutput> {
    type: 'final';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
    fee: string;
    feePerByte: string;
    bytes: number;
    transaction: ComposedTransaction<Input, Output>;
}

export type ComposeResult<Input extends ComposeInput, Output extends ComposeOutput> =
    | ComposeResultError
    | ComposeResultNonFinal
    | ComposeResultFinal<Input, Output>;
