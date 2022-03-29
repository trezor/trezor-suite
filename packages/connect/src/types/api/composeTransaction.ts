import type { PROTO } from '../../constants';
import type { AccountAddresses, Utxo as AccountUtxo } from '@trezor/blockchain-link';
import type { Params, Response } from '../params';

// TODO: get types from @trezor/utxo-lib
export interface RegularOutput {
    type?: 'external';
    address: string;
    amount: string;
    script_type?: 'PAYTOADDRESS';
}

export interface InternalOutput {
    type?: 'internal';
    address_n: number[];
    amount: string;
    script_type?: string;
}

export interface SendMaxOutput {
    type: 'send-max';
    address: string;
}

export interface OpReturnOutput {
    type: 'opreturn';
    dataHex: string;
}
export interface NoAddressOutput {
    type: 'noaddress';
    amount: string;
}

export interface NoAddressSendMaxOutput {
    type: 'send-max-noaddress';
}

export type ComposeOutput =
    | RegularOutput
    | InternalOutput
    | SendMaxOutput
    | OpReturnOutput
    | NoAddressOutput
    | NoAddressSendMaxOutput;

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

export interface PrecomposeParams {
    outputs: ComposeOutput[];
    coin: string;
    account: {
        path: string;
        addresses: AccountAddresses;
        utxo: (AccountUtxo & { required?: boolean })[];
    };
    feeLevels: { feePerUnit: string }[];
    push?: undefined;
    baseFee?: number;
    floorBaseFee?: boolean;
    sequence?: number;
    skipPermutation?: boolean;
}

export type PrecomposedTransaction =
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
          transaction: {
              inputs: PROTO.TxInputType[];
              outputs: PROTO.TxOutputType[];
              outputsPermutation: number[];
          };
      };

export declare function composeTransaction(
    params: Params<ComposeParams>,
): Response<SignedTransaction>;

export declare function composeTransaction(
    params: Params<PrecomposeParams>,
): Response<PrecomposedTransaction[]>;
