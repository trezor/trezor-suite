import { Dispatch, SetStateAction } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import { NetworkCompatible } from '@suite-common/wallet-config';
import { AccountUtxo, FeeLevel, PROTO } from '@trezor/connect';

import {
    Account,
    AccountKey,
    ExcludedUtxos,
    FeeInfo,
    FormOptions,
    FormState,
    Output,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export type ExportFileType = 'csv' | 'pdf' | 'json';

// local state of @wallet-hooks/useSendForm
export type UseSendFormState = {
    account: Account;
    network: NetworkCompatible;
    coinFees: FeeInfo;
    localCurrencyOption: { value: FiatCurrencyCode; label: Uppercase<FiatCurrencyCode> };
    feeInfo: FeeInfo;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    online: boolean;
    metadataEnabled: boolean;
};

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

export type RbfLabelsToBeUpdated = Record<
    AccountKey,
    {
        toBeMoved: WalletAccountTransaction;
        toBeDeleted: WalletAccountTransaction[];
    }
>;
