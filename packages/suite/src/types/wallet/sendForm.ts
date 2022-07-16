import { UseFormMethods } from 'react-hook-form';
import {
    FeeLevel,
    TokenInfo,
    ComposeOutput,
    PrecomposedTransaction as PrecomposedTransactionBase,
    CardanoInput,
    CardanoOutput,
} from '@trezor/connect';

import { ExtendedMessageDescriptor } from '@suite-types';
import { Account, Network, CoinFiatRates, RbfTransactionParams } from '@wallet-types';
import { TypedValidationRules } from './form';

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

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    dustLimit?: number; // coin dust limit
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in @trezor/connect > trezor-firmware/common
}

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

// eslint-disable-next-line camelcase
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
