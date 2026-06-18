import type { ComposeFeePolicy, TransactionInputOutputSortingStrategy } from './compose';

export type CoinSelectPaymentType = 'p2pkh' | 'p2sh' | 'p2tr' | 'p2wpkh' | 'p2wsh';

// Bitcoin script value is not relevant for coin selection,
// we only need its length to calculate the transaction size and fee.
export type CoinSelectScript = { length: number };

export interface CoinSelectOptions {
    txType: CoinSelectPaymentType;
    changeOutput?: CoinSelectOutput;
    dustThreshold?: number;
    longTermFeeRate?: number;
    own?: number;
    other?: number;
    coinbase?: number;

    /**
     * Fixed fee for (bitcoin-like) transaction, `finalFee = baseFee + (feeRate * size)`
     *
     * It is used for RBF and Cancel Transaction, where the new transaction must pay
     * for the chained transaction, as well as for its own bandwidth (see BIP-125 rules).
     */
    baseFee?: number;
    sortingStrategy: TransactionInputOutputSortingStrategy;
    feePolicy?: ComposeFeePolicy;
}

export interface CoinSelectInput {
    type: CoinSelectPaymentType;
    i: number;
    script: CoinSelectScript;
    value: bigint;
    confirmations: number;
    coinbase?: boolean;
    required?: boolean;
    own?: boolean;
    weight?: number;
}

export interface CoinSelectOutput {
    script: CoinSelectScript;
    value?: bigint;
    weight?: number;
}

export interface CoinSelectOutputFinal {
    script: CoinSelectScript;
    value: bigint;
}

export interface CoinSelectRequest extends CoinSelectOptions {
    inputs: CoinSelectInput[];
    outputs: CoinSelectOutput[];
    sendMaxOutputIndex: number;
    feeRate: number;
}

export type CoinSelectAlgorithm = (
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) => CoinSelectResult;

export interface CoinSelectSuccess {
    fee: number;
    inputs: CoinSelectInput[];
    outputs: CoinSelectOutputFinal[];
}

export interface CoinSelectFailure {
    fee: number;
    inputs?: never;
    outputs?: never;
}

export type CoinSelectResult = CoinSelectSuccess | CoinSelectFailure;
