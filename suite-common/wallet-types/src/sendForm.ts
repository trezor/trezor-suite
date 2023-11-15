import { Dispatch, SetStateAction } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import { Network } from '@suite-common/wallet-config';
import { AccountUtxo, FeeLevel, PROTO } from '@trezor/connect';

import { Account } from './account';
import { CoinFiatRates } from './fiatRates';
import {
    CurrencyOption,
    FeeInfo,
    Output,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    RbfTransactionParams,
} from './transaction';

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

export type ExcludedUtxos = Record<string, 'low-anonymity' | 'dust' | undefined>;

// local state of @wallet-hooks/useSendForm
export type UseSendFormState = {
    account: Account;
    network: Network;
    coinFees: FeeInfo;
    feeInfo: FeeInfo;
    fiatRates: CoinFiatRates | undefined;
    localCurrencyOption: CurrencyOption;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    online: boolean;
    metadataEnabled: boolean;
};

export interface ComposeActionContext {
    account: Account;
    network: Network;
    feeInfo: FeeInfo;
    excludedUtxos?: ExcludedUtxos;
    prison?: Record<string, unknown>;
}

export interface UtxoSelectionContext {
    excludedUtxos: ExcludedUtxos;
    allUtxosSelected: boolean;
    composedInputs: PROTO.TxInputType[];
    dustUtxos: AccountUtxo[];
    isCoinControlEnabled: boolean;
    lowAnonymityUtxos: AccountUtxo[];
    selectedUtxos: AccountUtxo[];
    spendableUtxos: AccountUtxo[];
    coinjoinRegisteredUtxos: AccountUtxo[];
    isLowAnonymityUtxoSelected: boolean;
    anonymityWarningChecked: boolean;
    toggleAnonymityWarning: () => void;
    toggleCheckAllUtxos: () => void;
    toggleCoinControl: () => void;
    toggleUtxoSelection: (utxo: AccountUtxo) => void;
}

// strongly typed UseFormMethods.getValues with fallback value
export interface GetDefaultValue {
    <K extends keyof FormState, T = undefined>(
        fieldName: K,
        fallback?: T,
    ): K extends keyof FormState ? FormState[K] : unknown;
    <K, T>(fieldName: K, fallback: T): K extends keyof FormState ? FormState[K] : T;
}

export type SendContextValues<TFormValues extends FormState = FormState> =
    UseFormReturn<TFormValues> &
        UseSendFormState & {
            isLoading: boolean;
            // additional fields
            outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
            updateContext: (value: Partial<UseSendFormState>) => void;
            resetContext: () => void;
            composeTransaction: (field?: FieldPath<TFormValues>) => void;
            loadTransaction: () => Promise<void>;
            signTransaction: () => void;
            // useSendFormFields utils:
            calculateFiat: (outputIndex: number, amount?: string) => void;
            setAmount: (outputIndex: number, amount: string) => void;
            changeFeeLevel: (currentLevel: FeeLevel['label']) => void;
            resetDefaultValue: (field: FieldPath<TFormValues>) => void;
            setMax: (index: number, active: boolean) => void;
            getDefaultValue: GetDefaultValue;
            toggleOption: (option: FormOptions) => void;
            // useSendFormOutputs utils:
            addOutput: () => void; // useFieldArray append
            removeOutput: (index: number) => void; // useFieldArray remove
            addOpReturn: () => void;
            removeOpReturn: (index: number) => void;
            // useSendFormCompose
            setDraftSaveRequest: Dispatch<SetStateAction<boolean>>;
            // UTXO selection
            utxoSelection: UtxoSelectionContext;
        };
