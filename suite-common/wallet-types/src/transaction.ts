import {
    AccountTransaction,
    AccountUtxo,
    AccountAddress,
    FeeLevel,
    TokenInfo,
    ComposeOutput,
    PrecomposedTransaction as PrecomposedTransactionBase,
    CardanoInput,
    CardanoOutput,
} from '@trezor/connect';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { ExtendedMessageDescriptor } from '@suite-common/intl-types';

import { TimestampedRates } from './fiatRates';
import { Account } from './account';

type FinalTransaction = Extract<PrecomposedTransactionBase, { type: 'final' }>;
export type PrecomposedTransactionFinalCardano = Omit<FinalTransaction, 'transaction'> & {
    ttl?: number;
    transaction: {
        inputs: CardanoInput[];
        outputs: CardanoOutput[];
        unsignedTx: {
            body: string;
            hash: string;
        };
    };
};

type PrecomposedTransactionBaseCardano =
    | Extract<PrecomposedTransactionBase, { type: 'error' }>
    | Extract<PrecomposedTransactionBase, { type: 'nonfinal' }>
    | PrecomposedTransactionFinalCardano;

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

export type PrecomposedTransactionError = Extract<PrecomposedTransactionBase, { type: 'error' }> & {
    errorMessage?: ExtendedMessageDescriptor;
};

export type PrecomposedTransactionErrorCardano = Extract<
    PrecomposedTransactionBaseCardano,
    { type: 'error' }
> & {
    errorMessage?: ExtendedMessageDescriptor;
};

export type PrecomposedTransactionNonFinal = Extract<
    PrecomposedTransactionBase,
    { type: 'nonfinal' }
> & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
};

export type PrecomposedTransactionNonFinalCardano = Extract<
    PrecomposedTransactionBaseCardano,
    { type: 'nonfinal' }
> & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
};

// base of PrecomposedTransactionFinal
type TxFinal = Extract<PrecomposedTransactionBase, { type: 'final' }> & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    rbf?: boolean;
};

// base of PrecomposedTransactionFinal
export type TxFinalCardano = Extract<PrecomposedTransactionBaseCardano, { type: 'final' }> & {
    max: string | undefined;
    feeLimit?: string;
    estimatedFeeLimit?: string;
    token?: TokenInfo;
    // fake all rbf props just to make it easier to work with since the codebase doesn't use type guards
    rbf?: false;
    prevTxid?: undefined;
    feeDifference?: undefined;
    useNativeRbf?: undefined;
    useDecreaseOutput?: undefined;
};

// strict distinction between normal and RBF type
export type PrecomposedTransactionFinal =
    | (TxFinal & {
          prevTxid?: typeof undefined;
          feeDifference?: typeof undefined;
          useNativeRbf?: typeof undefined;
          useDecreaseOutput?: typeof undefined;
      })
    | (TxFinal & {
          prevTxid: string;
          feeDifference: string;
          useNativeRbf: boolean;
          useDecreaseOutput: boolean;
      });

export type PrecomposedTransaction =
    | PrecomposedTransactionError
    | PrecomposedTransactionNonFinal
    | PrecomposedTransactionFinal;

export type PrecomposedTransactionCardano =
    | PrecomposedTransactionErrorCardano
    | PrecomposedTransactionNonFinalCardano
    | TxFinalCardano;

export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };
export type PrecomposedLevelsCardano = { [key: string]: PrecomposedTransactionCardano };

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
    ethereumNonce?: number;
    ethereumData?: string;
}

export interface WalletAccountTransaction extends AccountTransaction {
    deviceState: string;
    descriptor: string;
    symbol: NetworkSymbol;
    rates?: TimestampedRates['rates'];
    rbfParams?: RbfTransactionParams;
    /**
     * prepending txs have deadline (blockHeight) when they should be removed from UI
     */
    deadline?: number;
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
