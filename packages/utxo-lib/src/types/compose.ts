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

// Input to coinselect algorithm.
// array of Request, which is either
//    - 'payment' - address + amount
//    - 'send-max' - address
//    - 'opreturn' - dataHex
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info
export interface ComposeOutputAddress {
    type: 'payment';
    address: string;
    amount: string;
}

export interface ComposeOutputNoAddress {
    type: 'noaddress';
    amount: string;
}

export interface ComposeOutputMax {
    type: 'send-max'; // only one in TX request
    address: string;
    amount?: typeof undefined;
}

export interface ComposeOutputMaxNoAddress {
    type: 'send-max-noaddress';
    amount?: typeof undefined;
}

export interface ComposeOutputOpreturn {
    type: 'opreturn'; // it doesn't need to have address
    dataHex: string;
    amount?: typeof undefined;
    address?: typeof undefined;
}

export interface ComposeOutputChange {
    type: 'change';
    address: string;
    amount: string;
}

export interface ComposeChangeAddress {
    address: string;
}

export type ComposeFinalOutput = ComposeOutputAddress | ComposeOutputMax | ComposeOutputOpreturn;

export type ComposeNotFinalOutput = ComposeOutputNoAddress | ComposeOutputMaxNoAddress;

export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export interface ComposeRequest<
    Utxo extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
> {
    txType?: CoinSelectPaymentType;
    utxos: Utxo[]; // all inputs
    outputs: Output[]; // all output "requests"
    feeRate: string | number; // in sat/byte, virtual size
    network: Network;
    changeAddress: ChangeAddress;
    dustThreshold: number; // explicit dust threshold, in satoshi
    baseFee?: number; // DOGE base fee
    floorBaseFee?: boolean; // DOGE floor base fee to the nearest integer
    dustOutputFee?: number; // DOGE fee for every output below dust limit
    skipUtxoSelection?: boolean; // use custom utxo selection, without algorithm
    skipPermutation?: boolean; // Do not sort inputs/outputs and preserve the given order. Handy for RBF.
}

type ComposedTransactionOutputs<T> = T extends ComposeOutputMax
    ? Omit<T, 'type'> & ComposeOutputAddress
    : T extends ComposeFinalOutput
    ? T
    : never;

export interface ComposedTransaction<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
> {
    inputs: Input[];
    outputs: {
        sorted: (ComposedTransactionOutputs<Output> | (ChangeAddress & ComposeOutputChange))[];
        permutation: number[];
    };
}

// Output from coinselect algorithm
// 'nonfinal' - contains info about the outputs, but not Trezor tx
// 'final' - contains info about outputs + Trezor tx
// 'error' - some error, so far only NOT-ENOUGH-FUNDS and EMPTY strings

export interface ComposeResultError {
    type: 'error';
    error: string;
}

export interface ComposeResultNonFinal {
    type: 'nonfinal';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
    fee: string;
    feePerByte: string;
    bytes: number;
}

export interface ComposeResultFinal<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
> {
    type: 'final';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
    fee: string;
    feePerByte: string;
    bytes: number;
    transaction: ComposedTransaction<Input, Output, ChangeAddress>;
}

export type ComposeResult<
    Input extends ComposeInput,
    Output extends ComposeOutput,
    ChangeAddress extends ComposeChangeAddress,
> = ComposeResultError | ComposeResultNonFinal | ComposeResultFinal<Input, Output, ChangeAddress>;
