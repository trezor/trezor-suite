import type { Network } from '../networks';
import type { CoinSelectPaymentType } from './coinselect';

// UTXO == unspent transaction output = all I can spend
export interface ComposeInput {
    index: number; // index of output IN THE TRANSACTION
    transactionHash: string; // hash of the transaction
    value: string; // how much money sent
    addressPath: [number, number]; // path
    height?: number; // null == unconfirmed
    coinbase: boolean; // coinbase transaction = utxo from mining, cannot be spend before 100 blocks
    own: boolean; // is the ORIGIN me (the same account)
    required?: boolean; // must be included into transaction
    confirmations?: number; // TODO
}

// Input to coinselect algorithm.
// array of Request, which is either
//    - 'complete' - address + amount
//    - 'send-max' - address
//    - 'noaddress' - just amount
//    - 'send-max-noaddress' - no other info
export type ComposeFinalOutput =
    | {
          // TODO rename
          type: 'complete';
          address: string;
          amount: string; // in satoshi
      }
    | {
          type: 'send-max'; // only one in TX request
          address: string;
      }
    | {
          type: 'opreturn'; // it doesn't need to have address
          dataHex: string;
      };

export type ComposeNotFinalOutput =
    | {
          type: 'send-max-noaddress'; // only one in TX request
      }
    | {
          type: 'noaddress';
          amount: string;
      };

export type ComposeOutput = ComposeFinalOutput | ComposeNotFinalOutput;

export interface ComposeRequest {
    txType?: CoinSelectPaymentType;
    utxos: ComposeInput[]; // all inputs
    outputs: ComposeOutput[]; // all output "requests"
    height: number;
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

// types for building the transaction in trezor.js
export type ComposedTxOutput =
    | {
          path: number[];
          value: string;
          address?: typeof undefined;
          opReturnData?: typeof undefined;
      }
    | {
          address: string;
          value: string;
          path?: typeof undefined;
          opReturnData?: typeof undefined;
      }
    | {
          opReturnData: Buffer;
          path?: typeof undefined;
          address?: typeof undefined;
          value?: typeof undefined;
      };

export interface ComposedTxInput {
    hash: Buffer;
    index: number;
    path: number[];
    amount: string;
}

export interface ComposedTransaction {
    inputs: ComposedTxInput[];
    outputs: { sorted: ComposedTxOutput[]; permutation: number[] }; // compose/Permutation<X>
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

export interface ComposeResultFinal {
    type: 'final';
    max?: string;
    totalSpent: string; // all the outputs, no fee, no change
    fee: string;
    feePerByte: string;
    bytes: number;
    transaction: ComposedTransaction;
}

export type ComposeResult = ComposeResultError | ComposeResultNonFinal | ComposeResultFinal;
