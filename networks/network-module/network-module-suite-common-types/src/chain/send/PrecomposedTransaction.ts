import type { BaseCurrencyCode, TokenInfo } from '@trezor/blockchain-link-types';
import type {
    AccountAddress,
    AccountUtxo,
    ComposeOutput,
    FeeLevel,
    PrecomposedTransactionErrorCardano as PrecomposedTransactionCardanoConnectResponseError,
    PrecomposedTransactionFinalCardano as PrecomposedTransactionCardanoConnectResponseFinal,
    PrecomposedTransactionNonFinalCardano as PrecomposedTransactionCardanoConnectResponseNonFinal,
    PrecomposeResultError as PrecomposedTransactionConnectResponseError,
    PrecomposeResultFinal as PrecomposedTransactionConnectResponseFinal,
    PrecomposeResultNonFinal as PrecomposedTransactionConnectResponseNonFinal,
} from '@trezor/connect-common';
import type { Branded, ObjectValues } from '@trezor/type-utils';

export type { PrecomposedTransactionFinalCardano } from '@trezor/connect-common';

const COMMON_PRECOMPOSE_ERRORS = {
    AMOUNT_NOT_ENOUGH_CURRENCY_FEE: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    AMOUNT_IS_NOT_ENOUGH: 'AMOUNT_IS_NOT_ENOUGH',
    AMOUNT_IS_TOO_LOW: 'AMOUNT_IS_TOO_LOW',
    AMOUNT_IS_LESS_THAN_RESERVE: 'AMOUNT_IS_LESS_THAN_RESERVE',
    REMAINING_BALANCE_LESS_THAN_RENT: 'REMAINING_BALANCE_LESS_THAN_RENT',
    AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT:
        'AMOUNT_NOT_ENOUGH_CURRENCY_FEE_WITH_ETH_AMOUNT',
} as const satisfies Record<string, string>;

/**
 * @trezor/suite (packages/suite) errors
 */
export const SUITE_PRECOMPOSE_ERRORS = {
    ...COMMON_PRECOMPOSE_ERRORS,
    TR_NOT_ENOUGH_SELECTED: 'TR_NOT_ENOUGH_SELECTED',
    TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_WARNING',
    TR_GENERIC_ERROR_TITLE: 'TR_GENERIC_ERROR_TITLE',
    TR_STELLAR_SIMULATION_FAILED: 'TR_STELLAR_SIMULATION_FAILED',
    TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE: 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE',
} as const satisfies Record<string, string>;

type SuitePrecomposeError = ObjectValues<typeof SUITE_PRECOMPOSE_ERRORS>;

/**
 * @suite-native/* errors
 */
export const SUITE_NATIVE_PRECOMPOSE_ERRORS = {
    ...COMMON_PRECOMPOSE_ERRORS,
    TR_STAKE_NOT_ENOUGH_FUNDS: 'TR_STAKE_NOT_ENOUGH_FUNDS',
} as const satisfies Record<string, string>;

type SuiteNativePrecomposeError = ObjectValues<typeof SUITE_NATIVE_PRECOMPOSE_ERRORS>;

export type PrecomposeError = SuiteNativePrecomposeError | SuitePrecomposeError;

// extend errors from @trezor/connect + @trezor/utxo-lib with errors from sendForm actions
type PrecomposedTransactionErrorExtended =
    | PrecomposedTransactionConnectResponseError
    | {
          type: 'error';
          error: PrecomposeError;
      };

type PrecomposedTransactionCardanoNonFinal =
    PrecomposedTransactionCardanoConnectResponseNonFinal & {
        max?: string;
        feeLimit?: string;
        estimatedFeeLimit?: string;
        token?: TokenInfo;
    };

export type BaseCurrencyOption = { value: BaseCurrencyCode | ''; label: string };

/**
 * Target is the unified term for both Inputs and Outputs on the transaction.
 */
export type TxTargetId = string | Branded<'TxTargetId'>;
export const asTxTargetId = (value: string) => value as TxTargetId;

export type Output = {
    type: 'payment' | 'opreturn';
    address: string;
    // Onchain hex address a named input (e.g. ENS) resolved to, if any. The user-typed
    // name stays on `address`; composing/signing uses this resolved value when present.
    resolvedAddress?: string;
    amount: string;
    fiat: string;
    currency: BaseCurrencyOption;
    label?: string;
    token: string | null;
    dataHex?: string; // bitcoin opreturn/ethereum data
    dataAscii?: string; // bitcoin opreturn/ethereum data
};

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    minPriorityFee: number; // eth minimum max priority fee
    dustLimit?: number; // coin dust limit
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in @trezor/connect > trezor-firmware/common
}

export type ExternalOutput = Exclude<ComposeOutput, { type: 'opreturn' } | { address_n: number[] }>;

type ComposeError = {
    errorMessage?: {
        id: PrecomposeError;
        values?: Record<string, string>;
    };
};

export type PrecomposedTransactionError = PrecomposedTransactionErrorExtended & ComposeError;

type PrecomposedTransactionCardanoError = PrecomposedTransactionCardanoConnectResponseError &
    ComposeError;

export type SolanaTxMeta = {
    deviceAmountLamports: string;
    feeLamports: string;
    rentLamports: string;
    feeIncludingRentLamports: string;
};

type PrecomposedTransactionNonFinal = PrecomposedTransactionConnectResponseNonFinal & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    energyConsumed?: number;
    accountActivationFee?: string;
    memoFee?: string;
    solanaTxMeta?: SolanaTxMeta;
    isDeviceReviewOnly?: boolean;
};

// base of PrecomposedTransactionFinal
type PrecomposedTransactionBase = PrecomposedTransactionConnectResponseFinal & {
    max?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    energyConsumed?: number;
    accountActivationFee?: string;
    memoFee?: string;
    /** override the network's native token
     * used with EVMs that are used via Connect, but not natively supported in Suite */
    nativeToken?: TokenInfo;
    isTokenKnown?: boolean;
    createdTimestamp?: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    solanaTxMeta?: SolanaTxMeta;
    isDeviceReviewOnly?: boolean;
};

// base of PrecomposedTransactionFinal
export type PrecomposedTransactionCardanoFinal =
    PrecomposedTransactionCardanoConnectResponseFinal & {
        max?: string;
        feeLimit?: string;
        estimatedFeeLimit?: string;
        token?: TokenInfo;
        createdTimestamp?: number;
    };

export type RbfTransactionType = 'bump-fee' | 'cancel';

export type PrecomposedTransactionFinalBumpFeeRbf = PrecomposedTransactionBase & {
    rbfType: 'bump-fee';
    prevTxid: string;
    feeDifference: string;
    // Native RBF is a firmware feature to recognize an RBF transaction and simplify transaction review flow.
    useNativeRbf: boolean;
};

export type PrecomposedTransactionFinalCancelRbf = PrecomposedTransactionBase & {
    rbfType: 'cancel';
    prevTxid: string;
};

// Strict distinction between Normal-Tx and Bump-Fee-Tx / Cancel-Tx
export type PrecomposedTransactionFinal =
    | PrecomposedTransactionBase
    | PrecomposedTransactionFinalBumpFeeRbf
    | PrecomposedTransactionFinalCancelRbf;

export type PrecomposedTransaction =
    PrecomposedTransactionError | PrecomposedTransactionNonFinal | PrecomposedTransactionFinal;

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

export type GeneralPrecomposedLevels = PrecomposedLevels | PrecomposedLevelsCardano;

export interface RbfTransactionParamsBitcoin {
    type: 'bitcoin';
    txid: string;
    utxo: AccountUtxo[]; // original utxo used by this transaction
    outputs: Array<
        | {
              type: 'payment' | 'change';
              address: string;
              amount: string;
              formattedAmount: string;
              token?: undefined;
          }
        | {
              type: 'opreturn';
              dataHex: string;
              dataAscii: string;
          }
    >;
    changeAddress?: AccountAddress; // original change address
    feeRate: string; // original fee rate
    baseFee: number; // original fee
    locktime?: number;
}

export interface RbfTransactionParamsEthereum {
    type: 'ethereum';
    txid: string;
    outputs: Array<{
        type: 'payment';
        address: string;
        amount: string;
        formattedAmount: string;
        token?: string;
    }>;
    ethereumNonce: number;
    transactionData: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
}

export type RbfTransactionParams = RbfTransactionParamsBitcoin | RbfTransactionParamsEthereum;

export type ExcludedUtxos = Record<string, 'low-anonymity' | 'dust' | undefined>;

export type FeeLevelLabel = FeeLevel['label'];

export const isFinalPrecomposedTransaction = (
    tx?: GeneralPrecomposedTransaction,
): tx is PrecomposedTransactionFinal => !!tx && tx.type === 'final';

export const isRbfTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalBumpFeeRbf | PrecomposedTransactionFinalCancelRbf =>
    'rbfType' in tx;

export const isRbfBumpFeeTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalBumpFeeRbf => isRbfTransaction(tx) && tx.rbfType === 'bump-fee';

export const isRbfCancelTransaction = (
    tx: GeneralPrecomposedTransactionFinal,
): tx is PrecomposedTransactionFinalCancelRbf => isRbfTransaction(tx) && tx.rbfType === 'cancel';
