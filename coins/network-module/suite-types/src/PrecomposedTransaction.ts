type TokenInfo = {
    standard?: string;
    name?: string;
    contract: string;
    symbol?: string;
    decimals: number;
    balance?: string;
    ids?: string[];
    multiTokenValues?: unknown[];
    totalReceived?: string;
    totalSent?: string;
    accounts?: unknown[];
    policyId?: string;
    fingerprint?: string;
    protocols?: unknown;
};

type TxInput = Record<string, unknown>;

type TxOutput = {
    address?: string;
    amount?: string | number;
    script_type?: string;
    [key: string]: unknown;
};

type CardanoInput = Record<string, unknown>;

type CardanoOutput = {
    address?: string;
    amount?: string;
    assets?: Array<{
        policyId?: string;
        assetNameBytes?: string;
        fingerprint?: string;
        quantity: string;
    }>;
    [key: string]: unknown;
};

type PrecomposeError =
    | 'ADDRESSES-NOT-SET'
    | 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE'
    | 'AMOUNT_IS_NOT_ENOUGH'
    | 'AMOUNT_IS_TOO_LOW'
    | 'AMOUNT_IS_LESS_THAN_RESERVE'
    | 'REMAINING_BALANCE_LESS_THAN_RENT'
    | 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT'
    | 'MISSING-UTXOS'
    | 'MISSING-OUTPUTS'
    | 'INCORRECT-FEE-RATE'
    | 'INCORRECT-UTXO'
    | 'INCORRECT-OUTPUT'
    | 'NOT-ENOUGH-FUNDS'
    | 'COINSELECT'
    | 'UTXO_BALANCE_INSUFFICIENT'
    | 'UTXO_VALUE_TOO_SMALL'
    | 'TR_NOT_ENOUGH_SELECTED'
    | 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING'
    | 'TR_GENERIC_ERROR_TITLE'
    | 'TR_STAKE_NOT_ENOUGH_FUNDS';

type ComposeError = {
    errorMessage?: {
        id: PrecomposeError;
        values?: Record<string, string>;
    };
};

export type PrecomposedTransactionError = {
    type: 'error';
    error: PrecomposeError;
    message?: string;
} & ComposeError;

type PrecomposedTransactionCardanoError = {
    type: 'error';
    error: PrecomposeError;
} & ComposeError;

type PrecomposedTransactionNonFinal = {
    type: 'nonfinal';
    totalSpent: string;
    max?: string;
    fee: string;
    feePerByte: string;
    bytes: number;
    inputs: TxInput[];
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    energyConsumed?: number;
    accountActivationFee?: string;
    memoFee?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

type PrecomposedTransactionBase = {
    type: 'final';
    totalSpent: string;
    fee: string;
    feePerByte: string;
    bytes: number;
    inputs: TxInput[];
    outputs: TxOutput[];
    outputsPermutation: number[];
    max?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    energyConsumed?: number;
    accountActivationFee?: string;
    memoFee?: string;
    nativeToken?: TokenInfo;
    isTokenKnown?: boolean;
    createdTimestamp?: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

export type PrecomposedTransactionCardanoFinal = Omit<
    PrecomposedTransactionBase,
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

export type PrecomposedTransactionFinalCardano = PrecomposedTransactionCardanoFinal;

type PrecomposedTransactionCardanoNonFinal = Omit<PrecomposedTransactionNonFinal, 'inputs'> & {
    deposit?: string;
};

export type RbfTransactionType = 'bump-fee' | 'cancel';

export type PrecomposedTransactionFinalBumpFeeRbf = PrecomposedTransactionBase & {
    rbfType: 'bump-fee';
    prevTxid: string;
    feeDifference: string;
    useNativeRbf: boolean;
    useDecreaseOutput: boolean;
};

export type PrecomposedTransactionFinalCancelRbf = PrecomposedTransactionBase & {
    rbfType: 'cancel';
    prevTxid: string;
};

export type PrecomposedTransactionFinal =
    | PrecomposedTransactionBase
    | PrecomposedTransactionFinalBumpFeeRbf
    | PrecomposedTransactionFinalCancelRbf;

export type PrecomposedTransaction =
    | PrecomposedTransactionError
    | PrecomposedTransactionNonFinal
    | PrecomposedTransactionFinal;

export type PrecomposedTransactionCardano =
    | PrecomposedTransactionCardanoError
    | PrecomposedTransactionCardanoNonFinal
    | PrecomposedTransactionCardanoFinal;

export type GeneralPrecomposedTransaction = PrecomposedTransaction | PrecomposedTransactionCardano;

export type GeneralPrecomposedTransactionFinal = Extract<
    GeneralPrecomposedTransaction,
    { type: 'final' }
>;

export type PrecomposedLevels = Record<string, PrecomposedTransaction>;

export type PrecomposedLevelsCardano = Record<string, PrecomposedTransactionCardano>;

export type GeneralPrecomposedLevels = Record<string, GeneralPrecomposedTransaction>;
