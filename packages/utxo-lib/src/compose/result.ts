import type { ComposedTransaction } from './transaction';
import type { CompleteResult } from './coinselect';

// Output from coinselect algorithm
// 'nonfinal' - contains info about the outputs, but not Trezor tx
// 'final' - contains info about outputs + Trezor tx
// 'error' - some error, so far only NOT-ENOUGH-FUNDS and EMPTY strings
export type ComposeResult =
    | {
          type: 'error';
          error: string;
      }
    | {
          type: 'nonfinal';
          max?: string;
          totalSpent: string; // all the outputs, no fee, no change
          fee: string;
          feePerByte: string;
          bytes: number;
      }
    | {
          type: 'final';
          max?: string;
          totalSpent: string; // all the outputs, no fee, no change
          fee: string;
          feePerByte: string;
          bytes: number;
          transaction: ComposedTransaction;
      };

export const empty: ComposeResult = {
    type: 'error',
    error: 'EMPTY',
};

export function getNonfinalResult(result: CompleteResult): ComposeResult {
    const { max, fee, feePerByte, bytes, totalSpent } = result.result;

    return {
        type: 'nonfinal',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        max,
        totalSpent,
    };
}

export function getFinalResult(
    result: CompleteResult,
    transaction: ComposedTransaction,
): ComposeResult {
    const { max, fee, feePerByte, bytes, totalSpent } = result.result;

    return {
        type: 'final',
        fee: fee.toString(),
        feePerByte: feePerByte.toString(),
        bytes,
        transaction,
        max,
        totalSpent,
    };
}
