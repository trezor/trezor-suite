import { AccountUtxo, FeeLevel } from '@trezor/connect';

import { Output, RbfTransactionParams } from './transaction';

export type FormOptions =
    | 'broadcast'
    | 'utxoSelection'
    | 'bitcoinLockTime'
    | 'ethereumData'
    | 'ethereumNonce' // TODO
    | 'rippleDestinationTag';

export type UtxoSorting = 'newestFirst' | 'oldestFirst' | 'smallestFirst' | 'largestFirst';

export interface FormState {
    outputs: Output[]; // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
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
    bitcoinLockTime?: string; // bitcoin RBF/schedule
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumDataHex?: string;
    ethereumAdjustGasLimit?: string; // if used, final gas limit = estimated limit * ethereumAdjustGasLimit
    rippleDestinationTag?: string;
    rbfParams?: RbfTransactionParams;
    isCoinControlEnabled: boolean;
    hasCoinControlBeenOpened: boolean;
    anonymityWarningChecked?: boolean;
    selectedUtxos: AccountUtxo[];
    utxoSorting?: UtxoSorting;
    isTrading?: boolean;
}
