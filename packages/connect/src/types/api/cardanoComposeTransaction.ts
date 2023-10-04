import type { types, trezorUtils } from '@fivebinaries/coin-selection';
import type { AccountAddresses, AccountUtxo } from '../../exports';
import type { Params, Response } from '../params';
import type { CardanoCertificate, CardanoInput, CardanoOutput } from './cardano';
import type {
    PrecomposeResultFinal,
    PrecomposeResultNonFinal,
    PrecomposeResultError,
} from './composeTransaction';

export type PrecomposedTransactionFinalCardano = Omit<
    PrecomposeResultFinal,
    'inputs' | 'outputs' | 'outputsPermutation'
> & {
    deposit?: string;
    ttl?: number;
    inputs: CardanoInput[];
    outputs: CardanoOutput[];
    unsignedTx: {
        body: string;
        hash: string;
    };
};

export type PrecomposedTransactionNonFinalCardano = Omit<PrecomposeResultNonFinal, 'inputs'> & {
    deposit?: string;
};

export type PrecomposedTransactionErrorCardano =
    | PrecomposeResultError
    | {
          type: 'error';
          error: 'UTXO_BALANCE_INSUFFICIENT' | 'UTXO_VALUE_TOO_SMALL';
      };

export type PrecomposedTransactionCardano =
    | PrecomposedTransactionFinalCardano
    | PrecomposedTransactionNonFinalCardano
    | PrecomposedTransactionErrorCardano;

export type CardanoComposeTransactionParams = {
    account: {
        descriptor: string;
        addresses: AccountAddresses;
        utxo: AccountUtxo[];
    };
    feeLevels?: { feePerUnit?: string }[];
    outputs?: types.UserOutput[];
    certificates?: CardanoCertificate[];
    withdrawals?: types.Withdrawal[];
    changeAddress: { address: string; path: string };
    addressParameters: Parameters<(typeof trezorUtils)['transformToTrezorOutputs']>[1];
    testnet?: boolean;
};

export declare function cardanoComposeTransaction(
    params: Params<CardanoComposeTransactionParams>,
): Response<PrecomposedTransactionCardano[]>;
