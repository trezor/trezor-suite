import { UseFormMethods, FieldError, DeepPartial } from 'react-hook-form';
import { Account, Network, CoinFiatRates } from '@wallet-types';
import {
    FeeLevel,
    TokenInfo,
    ComposeOutput,
    PrecomposedTransaction as PrecomposedTransactionBase,
} from 'trezor-connect';
import { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { TypedValidationRules } from './form';

// react-hook-form state

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
    // advanced form inputs
    options: FormOptions[];
    bitcoinLockTime?: string; // bitcoin RBF/schedule
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumDataHex?: string;
    rippleDestinationTag?: string;
};

export type PartialFormState = DeepPartial<FormState>;

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in trezor-connect > trezor-firmware/common
}

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: Network['chainId'];
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

export type PrecomposedTransactionNonFinal = Extract<
    PrecomposedTransactionBase,
    { type: 'nonfinal' }
> & {
    max: string | undefined;
    feeLimit?: string;
    token?: TokenInfo;
};

export type PrecomposedTransactionFinal = Extract<PrecomposedTransactionBase, { type: 'final' }> & {
    max: string | undefined;
    feeLimit?: string;
    token?: TokenInfo;
};

export type PrecomposedTransaction =
    | PrecomposedTransactionError
    | PrecomposedTransactionNonFinal
    | PrecomposedTransactionFinal;

export type PrecomposedLevels = { [key: string]: PrecomposedTransaction };

// Props of @wallet-views/send/index
export interface SendFormProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    fiat: AppState['wallet']['fiat'];
    localCurrency: AppState['wallet']['settings']['localCurrency'];
    fees: AppState['wallet']['fees'];
    online: boolean;
    sendRaw?: boolean;
}
// Props of @wallet-hooks/useSendForm (selectedAccount should be loaded)
export interface UseSendFormProps extends SendFormProps {
    selectedAccount: Extract<SendFormProps['selectedAccount'], { status: 'loaded' }>;
}

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
    composedLevels?: PrecomposedLevels;
    online: boolean;
};

// strongly typed UseFormMethods.getValues with fallback value
interface GetDefaultValue {
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
        changeFeeLevel: (currentLevel: FeeLevel, newLevel: FeeLevel) => FieldError | void;
        resetDefaultValue: (field: string) => void;
        setMax: (index: number, active: boolean) => void;
        getDefaultValue: GetDefaultValue;
        toggleOption: (option: FormOptions) => void;
        // useSendFormOutputs utils:
        addOutput: () => void; // useFieldArray append
        removeOutput: (index: number) => void; // useFieldArray remove
        addOpReturn: () => void;
        removeOpReturn: (index: number) => void;
    };
