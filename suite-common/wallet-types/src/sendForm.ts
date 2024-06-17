import { AccountUtxo, FeeLevel } from '@trezor/connect';

import { Output, RbfTransactionParams } from './transaction';

export type FormOptions =
    | 'broadcast'
    | 'utxoSelection'
    | 'bitcoinRBF'
    | 'bitcoinLockTime'
    | 'ethereumData'
    | 'ethereumNonce' // TODO
    | 'rippleDestinationTag';

export interface FormState {
    outputs: Output[]; // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    feeLimit: string; // ethereum only (gasLimit)
    estimatedFeeLimit?: string; // ethereum only (gasLimit)
    baseFee?: number; // used by RBF from. pay for related transactions
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
}
