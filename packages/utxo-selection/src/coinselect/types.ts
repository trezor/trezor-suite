export type CoinSelectPaymentType = 'p2pkh' | 'p2sh' | 'p2tr' | 'p2wpkh' | 'p2wsh';

export type TransactionInputOutputSortingStrategy = 'bip69' | 'random' | 'none';

export type CoinSelectOptions = {
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

    /**
     * Only for DOGE
     */
    floorBaseFee?: boolean;
    sortingStrategy: TransactionInputOutputSortingStrategy;
    feePolicy?: 'bitcoin' | 'doge' | 'zcash';
};

export type CoinSelectInput = {
    type: CoinSelectPaymentType;
    i: number;
    script: { length: number };
    value: bigint;
    confirmations: number;
    coinbase?: boolean;
    required?: boolean;
    own?: boolean;
    weight?: number;
};

export type CoinSelectOutput = {
    script: { length: number };
    value?: bigint;
    weight?: number;
};

export type CoinSelectOutputFinal = {
    script: { length: number };
    value: bigint;
};

export type CoinSelectRequest = CoinSelectOptions & {
    inputs: CoinSelectInput[];
    outputs: CoinSelectOutput[];
    sendMaxOutputIndex: number;
    feeRate: number;
};

export type CoinSelectAlgorithm = (
    inputs: CoinSelectInput[],
    outputs: CoinSelectOutput[],
    feeRate: number,
    options: CoinSelectOptions,
) => CoinSelectResult;

export type CoinSelectSuccess = {
    fee: number;
    inputs: CoinSelectInput[];
    outputs: CoinSelectOutputFinal[];
};

export type CoinSelectFailure = {
    fee: number;
    inputs?: never;
    outputs?: never;
};

export type CoinSelectResult = CoinSelectSuccess | CoinSelectFailure;
