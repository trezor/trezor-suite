import { UseFormMethods } from 'react-hook-form';

import { Network } from '@suite-common/wallet-config';
import { FeeLevel } from '@trezor/connect';

import { TypedValidationRules } from './form';
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
    | 'bitcoinRBF'
    | 'bitcoinLockTime'
    | 'ethereumData'
    | 'ethereumNonce' // TODO
    | 'rippleDestinationTag';

export type FormState = {
    outputs: Output[];
    // output arrays, each element is corresponding with single Output item
    setMaxOutputId?: number;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    feeLimit: string; // ethereum only (gasLimit)
    estimatedFeeLimit?: string; // ethereum only (gasLimit)
    // advanced form inputs
    options: FormOptions[];
    bitcoinLockTime?: string; // bitcoin RBF/schedule
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumDataHex?: string;
    ethereumAdjustGasLimit?: string; // if used, final gas limit = estimated limit * ethereumAdjustGasLimit
    rippleDestinationTag?: string;
    rbfParams?: RbfTransactionParams;
};
// local state of @wallet-hooks/useSendForm
export type UseSendFormState = {
    account: Account;
    network: Network;
    coinFees: FeeInfo;
    feeInfo: FeeInfo;
    feeOutdated: boolean;
    fiatRates: CoinFiatRates | undefined;
    localCurrencyOption: CurrencyOption;
    isLoading: boolean;
    isDirty: boolean;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    online: boolean;
    metadataEnabled: boolean;
};

// strongly typed UseFormMethods.getValues with fallback value
export interface GetDefaultValue {
    <K extends keyof FormState, T = undefined>(
        fieldName: K,
        fallback?: T,
    ): K extends keyof FormState ? FormState[K] : unknown;
    <K, T>(fieldName: K, fallback: T): K extends keyof FormState ? FormState[K] : T;
}

export type SendContextValues = Omit<UseFormMethods<FormState>, 'register'> &
    UseSendFormState & {
        // strongly typed UseFormMethods.register
        register: (rules?: TypedValidationRules) => (ref: any) => void; // TODO: ReturnType of UseFormMethods['register'] union
        // additional fields
        outputs: Partial<Output & { id: string }>[]; // useFieldArray fields
        updateContext: (value: Partial<UseSendFormState>) => void;
        resetContext: () => void;
        composeTransaction: (field?: string) => void;
        loadTransaction: () => Promise<void>;
        signTransaction: () => void;
        // useSendFormFields utils:
        calculateFiat: (outputIndex: number, amount?: string) => void;
        setAmount: (outputIndex: number, amount: string) => void;
        changeFeeLevel: (currentLevel: FeeLevel['label']) => void;
        resetDefaultValue: (field: string) => void;
        setMax: (index: number, active: boolean) => void;
        getDefaultValue: GetDefaultValue;
        toggleOption: (option: FormOptions) => void;
        // useSendFormOutputs utils:
        addOutput: () => void; // useFieldArray append
        removeOutput: (index: number) => void; // useFieldArray remove
        addOpReturn: () => void;
        removeOpReturn: (index: number) => void;
        // useSendFormCompose
        setDraftSaveRequest: React.Dispatch<React.SetStateAction<boolean>>;
    };
