import { type CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountUtxo, FeeLevel } from '@trezor/connect';

import { type AccountKey } from './account';
import { type Output, type RbfTransactionParams } from './transaction';

export type FormOptions =
    | 'broadcast'
    | 'utxoSelection'
    | 'bitcoinLocktime'
    | 'transactionData'
    | 'ethereumNonce' // TODO
    | 'destinationTag';

export type UtxoSorting = 'newestFirst' | 'oldestFirst' | 'smallestFirst' | 'largestFirst';

export type FormStateTradingCryptoCurrency = {
    cryptoId: CryptoId | undefined;
    accountKey: AccountKey | undefined;
    symbol: NetworkSymbol;
    contractAddress?: string;
    amount: string;
};

export type FormStateTradingFiatCurrency = {
    amount: string;
    fiatCurrency: string;
};

export type FormStateTradingDefault = {
    activeSection: 'sell' | 'exchange';
    isSlip24Active: boolean;
};

type FormStateTradingCommon = {
    recipientName: string;
    send: FormStateTradingCryptoCurrency;
    isSlip24Active: boolean;
};

type FormStateTradingSell = {
    activeSection: 'sell';
    receive: FormStateTradingFiatCurrency;
} & FormStateTradingCommon;

export type FormStateTradingExchange = {
    activeSection: 'exchange';
    receive: FormStateTradingCryptoCurrency;
} & FormStateTradingCommon;

export type FormStateTrading =
    | FormStateTradingSell
    | FormStateTradingExchange
    | FormStateTradingDefault;

export interface FormState {
    outputs: Output[]; // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    maxPriorityFeePerGas?: string; // ethereum eip1559 only
    maxFeePerGas?: string; // ethereum eip1559 only
    baseFeePerGas?: string; // ethereum eip1559 only
    feeLimit: string; // ethereum only (gasLimit)
    estimatedFeeLimit?: string; // ethereum only (gasLimit)

    /**
     * Fee that was paid by chained transactions. To perform RBF transaction (bump fee or cancel)
     * we must pay higher fee than all previous transactions + its own relay fee (see BIP-125 rules)
     *
     * This is passed down to `utxo-lib` as `baseFee` parameter (see `CoinSelectOptions`).
     */
    baseFee?: number;

    // advanced form inputs
    options: FormOptions[];
    bitcoinLocktimeBlockHeight?: string;
    bitcoinLocktimeDatetime?: string;
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumAdjustGasLimit?: string; // if used, final gas limit = estimated limit * ethereumAdjustGasLimit
    transactionData?: string; // used for solana serialized txn from trading api, ethereum txn hex data, or bitcoin psbt hex
    destinationTag?: string; // For Ripple and Stellar
    rbfParams?: RbfTransactionParams;
    isCoinControlEnabled: boolean;
    hasCoinControlBeenOpened: boolean;
    anonymityWarningChecked?: boolean;
    selectedUtxos: AccountUtxo[];
    utxoSorting?: UtxoSorting;
    trading?: FormStateTrading;
}
