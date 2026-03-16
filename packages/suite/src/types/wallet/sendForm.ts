import { type Dispatch, type SetStateAction } from 'react';
import { type FieldPath, type UseFormReturn } from 'react-hook-form';

import { type Network } from '@suite-common/wallet-config';
import {
    type Account,
    type ExcludedUtxos,
    type FeeInfo,
    type FormOptions,
    type FormState,
    type Output,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type Rate,
    type UtxoSorting,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type AccountUtxo, type FeeLevel, type PROTO } from '@trezor/connect';

import {
    type HandleAmountChangeParams,
    type HandleFiatChangeParams,
} from 'src/hooks/wallet/useSendFormChangeHandlers';
import { type GetCurrentRateParams } from 'src/hooks/wallet/useSendFormFields';

// local state of @wallet-hooks/useSendForm
export type UseSendFormState = {
    account: Account;
    network: Network;
    localCurrencyOption: { value: BaseCurrencyCode; label: Uppercase<BaseCurrencyCode> };
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
    utxoSorting?: UtxoSorting;
    selectUtxoSorting: (ordering: UtxoSorting) => void;
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
            methods: UseFormReturn<TFormValues>;
            isLoading: boolean;
            feeInfo: FeeInfo;
            // additional fields
            outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
            updateContext: (value: Partial<UseSendFormState>) => void;
            resetContext: () => void;
            resetDraft: () => void;
            composeTransaction: (field?: FieldPath<TFormValues>) => void;
            loadTransaction: () => Promise<void>;
            signTransaction: () => void;
            // useSendFormFields utils:
            getCurrentFiatRate: ({
                currencyCode,
                tokenAddress,
            }: GetCurrentRateParams) => Rate | undefined;
            handleAmountChange: (params: HandleAmountChangeParams) => void;
            handleFiatChange: (params: HandleFiatChangeParams) => void;
            setAmount: (outputIndex: number, amount: string) => void;
            changeFeeLevel: (currentLevel: FeeLevel['label']) => void;
            resetDefaultValue: (field: FieldPath<TFormValues>) => void;
            setMax: (index: number, active: boolean, clearInput?: boolean) => void;
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
            showReserveBanner: boolean;
            setShowReserveBanner: (show: boolean) => void;
        };
