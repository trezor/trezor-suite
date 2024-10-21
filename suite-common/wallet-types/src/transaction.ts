import {
    AccountTransaction,
    AccountUtxo,
    AccountAddress,
    FeeLevel,
    TokenInfo,
    ComposeOutput,
    PrecomposeResultError as PrecomposedTransactionConnectResponseError,
    PrecomposeResultNonFinal as PrecomposedTransactionConnectResponseNonFinal,
    PrecomposeResultFinal as PrecomposedTransactionConnectResponseFinal,
    PrecomposedTransactionErrorCardano as PrecomposedTransactionCardanoConnectResponseError,
    PrecomposedTransactionNonFinalCardano as PrecomposedTransactionCardanoConnectResponseNonFinal,
    PrecomposedTransactionFinalCardano as PrecomposedTransactionCardanoConnectResponseFinal,
    StaticSessionId,
} from '@trezor/connect';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { TranslationKey } from '@suite-common/intl-types';

import { Account } from './account';

export type { PrecomposedTransactionFinalCardano } from '@trezor/connect';

// extend errors from @trezor/connect + @trezor/utxo-lib with errors from sendForm actions
type PrecomposedTransactionErrorExtended =
    | PrecomposedTransactionConnectResponseError
    | {
          type: 'error';
          error:
              | 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE'
              | 'AMOUNT_IS_NOT_ENOUGH'
              | 'AMOUNT_IS_TOO_LOW'
              | 'AMOUNT_IS_LESS_THAN_RESERVE'
              | 'TR_STAKE_NOT_ENOUGH_FUNDS'
              | 'REMAINING_BALANCE_LESS_THAN_RENT';
      };

export type PrecomposedTransactionCardanoNonFinal =
    PrecomposedTransactionCardanoConnectResponseNonFinal & {
        max?: string;
        feeLimit?: string;
        estimatedFeeLimit?: string;
        token?: TokenInfo;
    };

export type CurrencyOption = { value: string; label: string };

export type Output = {
    type: 'payment' | 'opreturn';
    address: string;
    amount: string;
    fiat: string;
    currency: CurrencyOption;
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
    dustLimit?: number; // coin dust limit
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in @trezor/connect > trezor-firmware/common
}

export type NetworksFees = Record<NetworkSymbol, FeeInfo>;

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: number;
    to: string;
    amount: string;
    data?: string;
    gasLimit: string;
    gasPrice: string;
    nonce: string;
};

export type ExternalOutput = Exclude<ComposeOutput, { type: 'opreturn' } | { address_n: number[] }>;

type ComposeError = {
    errorMessage?: {
        id: TranslationKey;
        values?: Record<string, string>;
    };
};

export type PrecomposedTransactionError = PrecomposedTransactionErrorExtended & ComposeError;

export type PrecomposedTransactionCardanoError = PrecomposedTransactionCardanoConnectResponseError &
    ComposeError;

export type PrecomposedTransactionNonFinal = PrecomposedTransactionConnectResponseNonFinal & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
};

// base of PrecomposedTransactionFinal
type TxFinal = PrecomposedTransactionConnectResponseFinal & {
    max?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    isTokenKnown?: boolean;
};

// base of PrecomposedTransactionFinal
export type PrecomposedTransactionCardanoFinal =
    PrecomposedTransactionCardanoConnectResponseFinal & {
        max?: string;
        feeLimit?: string;
        estimatedFeeLimit?: string;
        token?: TokenInfo;
    };

export type PrecomposedTransactionFinalRbf = TxFinal & {
    prevTxid: string;
    feeDifference: string;
    // Native RBF is a firmware feature to recognize an RBF transaction and simplify transaction review flow.
    useNativeRbf: boolean;
    useDecreaseOutput: boolean;
};

// strict distinction between normal and RBF type
export type PrecomposedTransactionFinal = TxFinal | PrecomposedTransactionFinalRbf;

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

export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };
export type PrecomposedLevelsCardano = { [key: string]: PrecomposedTransactionCardano };
export type GeneralPrecomposedLevels = PrecomposedLevels | PrecomposedLevelsCardano;

export interface RbfTransactionParams {
    txid: string;
    utxo: AccountUtxo[]; // original utxo used by this transaction
    outputs: Array<
        | {
              type: 'payment' | 'change';
              address: string;
              amount: string;
              formattedAmount: string;
              token?: string;
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
    ethereumNonce?: number;
    ethereumData?: string;
}

export interface WalletAccountTransaction extends AccountTransaction {
    deviceState: StaticSessionId;
    descriptor: string;
    symbol: NetworkSymbol;
    rbfParams?: RbfTransactionParams;
    /**
     * prepending txs have deadline (blockHeight) when they should be removed from UI
     */
    deadline?: number;
}

export interface ChainedTransactions {
    own: WalletAccountTransaction[];
    others: WalletAccountTransaction[];
}

export interface SignTransactionData {
    account: Account;
    address: string;
    amount: string;
    network: Network;
    destinationTag?: string;
    transactionInfo: PrecomposedTransactionFinal | null;
}

export interface ComposeTransactionData {
    account: Account;
    amount: string;
    feeInfo: FeeInfo;
    feePerUnit: string;
    feeLimit: string;
    network: Network;
    selectedFee: FeeLevel['label'];
    isMaxActive: boolean;
    address?: string;
    token?: string;
    ethereumDataHex?: string;
    isInvity?: boolean;
}

export interface SignedTx {
    tx: string;
    coin: string;
}

export interface ReviewTransactionData {
    signedTx: SignedTx | undefined;
    transactionInfo: PrecomposedTransactionFinal;
    extraFields?: {
        destinationTag?: string;
    };
}

export type TransactionFiatRateUpdatePayload = {
    txid: string;
    account: Account;
    updateObject: Partial<WalletAccountTransaction>;
    ts: number;
};

export type TransactionType = Pick<WalletAccountTransaction, 'type'>['type'];

export type ExportFileType = 'csv' | 'pdf' | 'json';

export type ReviewOutput =
    | {
          type:
              | 'opreturn'
              | 'data'
              | 'locktime'
              | 'fee'
              | 'destination-tag'
              | 'txid'
              | 'address'
              | 'amount'
              | 'gas'
              | 'contract'
              | 'regular_legacy';
          label?: string;
          value: string;
          value2?: string;
          token?: TokenInfo;
      }
    | {
          type: 'fee-replace';
          label?: undefined;
          value: string;
          value2: string;
          token?: undefined;
      }
    | {
          type: 'reduce-output';
          label: string;
          value: string;
          value2: string;
          token?: undefined;
      };

export type ReviewOutputType = ReviewOutput['type'];

export type ReviewOutputState = 'active' | 'success' | undefined;

export type ExcludedUtxos = Record<string, 'low-anonymity' | 'dust' | undefined>;

export type FeeLevelLabel = FeeLevel['label'];

export const isFinalPrecomposedTransaction = (
    tx: GeneralPrecomposedTransaction,
): tx is PrecomposedTransactionFinal => {
    return tx.type === 'final';
};
