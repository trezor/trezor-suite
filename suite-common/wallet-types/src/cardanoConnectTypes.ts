import {
    PrecomposeResultFinal,
    PrecomposeResultNonFinal,
    PrecomposeResultError,
    CardanoInput,
    CardanoOutput,
} from '@trezor/connect';

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
